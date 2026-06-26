import { TemplateType } from "../../../generated/prisma/enums";

export interface ICreateTemplatePayload {
    key: string;
    title: string;
    description: string;
    type: TemplateType;
    category: string;
    promptHint?: string;
    isActive?: boolean;
}

export interface IUpdateTemplatePayload {
    key?: string;
    title?: string;
    description?: string;
    type?: TemplateType;
    category?: string;
    promptHint?: string;
    isActive?: boolean;
}

export interface ITemplateQuery {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    type?: string;
    isActive?: boolean;
}