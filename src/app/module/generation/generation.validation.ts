// src/app/module/generations/generation.validation.ts
import { z } from "zod";

export const createGenerationSchema = z.object({
    templateId: z.string().min(1, "Template ID is required"),
    prompt: z.string().min(1, "Prompt is required"),
    model: z.string().min(1).optional(),
    temperature: z.coerce.number().min(0).max(2).optional(),
    metadata: z.object({}).catchall(z.unknown()).optional(),
});

export const updateGenerationSchema = z.object({
    status: z.string().optional(),
    errorMessage: z.string().optional(),
    tokensUsed: z.coerce.number().int().nonnegative().optional(),
});

export const generationQuerySchema = z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
    templateId: z.string().optional(),
    status: z.string().optional(),
});