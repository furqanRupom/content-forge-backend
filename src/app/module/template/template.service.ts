// src/app/module/templates/templates.service.ts
import AppError from "../../errorHelpers/AppError";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { prisma } from "../../lib/prisma";
import status from "http-status";
import {
  ICreateTemplatePayload,
  ITemplateQuery,
  IUpdateTemplatePayload,
} from "./template.interface";
import { TemplateType } from "../../../generated/prisma/enums";
import { QueryBuilder } from "../../utils/queryBuilder";
import { IQueryParams } from "../../interfaces/query.interface";
class Service {
  async createTemplate(payload: ICreateTemplatePayload, user: IRequestUser) {
    const existing = await prisma.template.findUnique({
      where: { key: payload.key },
    });

    if (existing) {
      throw new AppError(status.CONFLICT, "Template key already exists");
    }

    const template = await prisma.template.create({
      data: {
        key: payload.key,
        title: payload.title,
        description: payload.description,
        type: payload.type,
        category: payload.category,
        promptHint: payload.promptHint ?? null,
        isActive: payload.isActive ?? true,
      },
    });

    return template;
  }

  async getAllTemplates(query: Record<string, unknown>) {

    const templateQueryInstance = new QueryBuilder(prisma.template, query as IQueryParams, {
      searchableFields: ["key", "title", "description", "category"],
      filterableFields: ["category", "type", "isActive"],
    });

    const result = await templateQueryInstance
      .search()
      .filter()
      .paginate()
      .sort() // Defaults to createdAt: 'desc' automatically
      .include({
        generationJobs: {
          select: {
            id: true,
            status: true,
            createdAt: true,
          },
        },
        _count: {
          select: { generationJobs: true },
        },
      })
      .execute();

    return {
      data: result.data, // Map 'data' to 'templates' to preserve API contract
      meta: result.meta,
    };
  }
  async getTemplateById(id: string) {
    const template = await prisma.template.findUnique({
      where: { id },
      include: {
        generationJobs: {
          select: {
            id: true,
            status: true,
            createdAt: true,
          },
        },
        _count: {
          select: { generationJobs: true },
        },
      },
    });

    if (!template) {
      throw new AppError(status.NOT_FOUND, "Template not found");
    }

    return template;
  }

  async updateTemplate(id: string, payload: IUpdateTemplatePayload) {
    const existing = await prisma.template.findUnique({ where: { id } });

    if (!existing) {
      throw new AppError(status.NOT_FOUND, "Template not found");
    }

    const updated = await prisma.template.update({
      where: { id },
      data: {
        ...(payload.key !== undefined && { key: payload.key }),
        ...(payload.title !== undefined && { title: payload.title }),
        ...(payload.description !== undefined && { description: payload.description }),
        ...(payload.type !== undefined && { type: payload.type }),
        ...(payload.category !== undefined && { category: payload.category }),
        ...(payload.promptHint !== undefined && { promptHint: payload.promptHint }),
        ...(payload.isActive !== undefined && { isActive: payload.isActive }),
      },
    });

    return updated;
  }

  async deleteTemplate(id: string) {
    const existing = await prisma.template.findUnique({ where: { id } });

    if (!existing) {
      throw new AppError(status.NOT_FOUND, "Template not found");
    }

    await prisma.template.delete({ where: { id } });

    return { id };
  }
}

export const TemplateService = new Service();
