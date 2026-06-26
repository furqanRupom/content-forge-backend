import { Prisma } from "../../../generated/prisma/client";
import { GenerationStatus } from "../../../generated/prisma/enums";

export interface IGenerationMetadata {
    title?: string;
    tone?: string;
    language?: string;

    /**
     * Additional variables that can be injected into the prompt.
     * Example:
     * {
     *   company: "OpenAI",
     *   audience: "Backend Developers"
     * }
     */
    variables?: Record<string, Prisma.InputJsonValue>;

    /**
     * Allow custom metadata without restricting future growth.
     */
    [key: string]: unknown;
}

export interface ICreateGenerationPayload {
    templateId: string;
    prompt: string;

    /**
     * Optional AI model.
     * Example:
     * gemini-2.5-flash
     * gemini-2.5-pro
     */
    model?: string;

    /**
     * 0 - 2
     */
    temperature?: number;

    metadata?: IGenerationMetadata;
}

export interface IUpdateGenerationPayload {
    status?: GenerationStatus;
    tokensUsed?: number;
    errorMessage?: string;
}

export interface IGenerationQuery {
    page?: number;
    limit?: number;

    templateId?: string;
    status?: GenerationStatus;
}