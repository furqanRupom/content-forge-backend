// src/app/module/generations/generations.service.ts
import AppError from "../../errorHelpers/AppError";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { prisma } from "../../lib/prisma";
import status from "http-status";
import {
    ICreateGenerationPayload,
    IGenerationQuery,
    IUpdateGenerationPayload,
} from "./generation.interface";
import { GenerationStatus } from "../../../generated/prisma/enums";
import { Prisma } from "../../../generated/prisma/client";
import { envVars } from "../../config/env";

class Service {
    private async callGeminiAPI(prompt: string, model: string, temperature: number) {
        const apiKey = envVars.GOOGLE_AI_STUDIO_API_KEY || "";

        if (!apiKey) {
            throw new AppError(status.INTERNAL_SERVER_ERROR, "Google AI API key is missing");
        }

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [
                        {
                            role: "user",
                            parts: [{ text: prompt }],
                        },
                    ],
                    generationConfig: {
                        temperature,
                        maxOutputTokens: 2048,
                    },
                }),
            }
        );

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new AppError(
                status.BAD_GATEWAY,
                `AI generation failed: ${(err as any)?.error?.message || response.statusText}`
            );
        }

        const data = (await response.json()) as any;
        const result = data.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") || "";
        const tokensUsed =
            (data.usageMetadata?.promptTokenCount || 0) +
            (data.usageMetadata?.candidatesTokenCount || 0);

        return { result, tokensUsed };
    }

    async createGeneration(payload: ICreateGenerationPayload, user: IRequestUser) {
        const { prompt, templateId, model = "gemini-1.5-flash", metadata, temperature = 0.7 } = payload;

        const template = await prisma.template.findUnique({
            where: { id: templateId },
        });

        if (!template) {
            throw new AppError(status.NOT_FOUND, "Template not found");
        }

        const generationJob = await prisma.generationJob.create({
            data: {
                userId: user.userId,
                templateId,
                inputPrompt: prompt,
                inputPayload: metadata as Prisma.InputJsonValue || {},
                status: GenerationStatus.QUEUED,
                model,
                temperature,
                tokensUsed: 0,
            },
        });

        try {
            await prisma.generationJob.update({
                where: { id: generationJob.id },
                data: { status: GenerationStatus.PROCESSING },
            });

            const finalPrompt = `${template.promptHint || template.description}\n\n${prompt}`;
            const { result, tokensUsed } = await this.callGeminiAPI(finalPrompt, model, temperature);
            const wordCount = result.trim() ? result.trim().split(/\s+/).length : 0;

            const content = await prisma.generatedContent.create({
                data: {
                    jobId: generationJob.id,
                    title: (metadata as any)?.title || template.title,
                    outputText: result,
                    outputPayload: {
                        raw: result,
                        metadata: metadata as Prisma.InputJsonValue || {},
                    },
                    tone: (metadata as any)?.tone || null,
                    language: (metadata as any)?.language || "en",
                    wordCount,
                },
            });

            const updatedJob = await prisma.generationJob.update({
                where: { id: generationJob.id },
                data: {
                    status: GenerationStatus.COMPLETED,
                    tokensUsed,
                },
                include: {
                    template: true,
                    generatedContent: true,
                },
            });

            return {
                ...updatedJob,
                generatedContent: content,
            };
        } catch (error: any) {
            await prisma.generationJob.update({
                where: { id: generationJob.id },
                data: {
                    status: GenerationStatus.FAILED,
                    errorMessage: error?.message || "Generation failed",
                },
            });
            throw error;
        }
    }

    async getAllGenerations(query: IGenerationQuery, user: IRequestUser) {
        const page = Number(query.page || 1);
        const limit = Number(query.limit || 10);
        const skip = (page - 1) * limit;

        const where: any = { userId: user.userId };
        if (query.templateId) where.templateId = query.templateId;
        if (query.status) where.status = query.status;

        const [generationJobs, total] = await Promise.all([
            prisma.generationJob.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    template: true,
                    generatedContent: true,
                },
            }),
            prisma.generationJob.count({ where }),
        ]);

        return {
            generationJobs,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getGenerationById(id: string, user: IRequestUser) {
        const generationJob = await prisma.generationJob.findFirst({
            where: { id, userId: user.userId },
            include: {
                template: true,
                generatedContent: true,
            },
        });

        if (!generationJob) {
            throw new AppError(status.NOT_FOUND, "Generation not found");
        }

        return generationJob;
    }

    async updateGeneration(id: string, payload: IUpdateGenerationPayload, user: IRequestUser) {
        const existing = await prisma.generationJob.findFirst({
            where: { id, userId: user.userId },
        });

        if (!existing) {
            throw new AppError(status.NOT_FOUND, "Generation not found");
        }

        return prisma.generationJob.update({
            where: { id },
            data: {
                ...(payload.status !== undefined && { status: payload.status }),
                ...(payload.errorMessage !== undefined && { errorMessage: payload.errorMessage }),
                ...(payload.tokensUsed !== undefined && { tokensUsed: payload.tokensUsed }),
            },
            include: {
                template: true,
                generatedContent: true,
            },
        });
    }

    async deleteGeneration(id: string, user: IRequestUser) {
        const existing = await prisma.generationJob.findFirst({
            where: { id, userId: user.userId },
        });

        if (!existing) {
            throw new AppError(status.NOT_FOUND, "Generation not found");
        }

        await prisma.generationJob.delete({ where: { id } });
        return { id };
    }

    async regenerate(id: string, user: IRequestUser) {
        const existing = await prisma.generationJob.findFirst({
            where: { id, userId: user.userId },
            include: {
                template: true,
                generatedContent: true,
            },
        });

        if (!existing) {
            throw new AppError(status.NOT_FOUND, "Generation not found");
        }

        if (!existing.template) {
            throw new AppError(status.BAD_REQUEST, "Template not found");
        }

        await prisma.generationJob.update({
            where: { id },
            data: {
                status: GenerationStatus.PROCESSING,
                errorMessage: null,
            },
        });

        try {
            const finalPrompt = `${existing.template.promptHint || existing.template.description}\n\n${existing.inputPrompt}`;
            const { result, tokensUsed } = await this.callGeminiAPI(
                finalPrompt,
                existing.model,
                existing.temperature
            );

            const wordCount = result.trim() ? result.trim().split(/\s+/).length : 0;

            if (existing.generatedContent) {
                await prisma.generatedContent.update({
                    where: { jobId: id },
                    data: {
                        outputText: result,
                        outputPayload: {
                            raw: result,
                            regeneratedAt: new Date().toISOString(),
                        },
                        wordCount,
                    },
                });
            } else {
                await prisma.generatedContent.create({
                    data: {
                        jobId: id,
                        title: existing.template.title,
                        outputText: result,
                        outputPayload: {
                            raw: result,
                            regeneratedAt: new Date().toISOString(),
                        },
                        wordCount,
                    },
                });
            }

            const updatedJob = await prisma.generationJob.update({
                where: { id },
                data: {
                    status: GenerationStatus.COMPLETED,
                    tokensUsed,
                    errorMessage: null,
                },
                include: {
                    template: true,
                    generatedContent: true,
                },
            });

            return updatedJob;
        } catch (error: any) {
            await prisma.generationJob.update({
                where: { id },
                data: {
                    status: GenerationStatus.FAILED,
                    errorMessage: error?.message || "Generation failed",
                },
            });
            throw error;
        }
    }
}

export const GenerationService = new Service();