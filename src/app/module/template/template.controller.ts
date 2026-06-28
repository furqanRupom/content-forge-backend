// src/app/module/templates/templates.controller.ts
import { Request, Response } from "express";
import status from "http-status";
import BaseController from "../../shared/baseController";
import { TemplateService } from "./template.service";

class Controller extends BaseController {
    create = this.catchAsync(async (req: Request, res: Response) => {
        const result = await TemplateService.createTemplate(req.body, req.user);
        this.sendResponse(res, {
            statusCode: status.CREATED,
            success: true,
            message: "Template created successfully",
            data: result,
        });
    });

    getAll = this.catchAsync(async (req: Request, res: Response) => {
        const result = await TemplateService.getAllTemplates(req.query as any);
        this.sendResponse(res, {
            statusCode: status.OK,
            success: true,
            message: "Templates fetched successfully",
            meta:result.meta,
            data: result.data,
        });
    });

    getById = this.catchAsync(async (req: Request, res: Response) => {
        const result = await TemplateService.getTemplateById(req.params.id as string);
        this.sendResponse(res, {
            statusCode: status.OK,
            success: true,
            message: "Template fetched successfully",
            data: result,
        });
    });

    update = this.catchAsync(async (req: Request, res: Response) => {
        const result = await TemplateService.updateTemplate(req.params.id as string, req.body);
        this.sendResponse(res, {
            statusCode: status.OK,
            success: true,
            message: "Template updated successfully",
            data: result,
        });
    });

    delete = this.catchAsync(async (req: Request, res: Response) => {
        const result = await TemplateService.deleteTemplate(req.params.id as string);
        this.sendResponse(res, {
            statusCode: status.OK,
            success: true,
            message: "Template deleted successfully",
            data: result,
        });
    });
}

export const TemplateController = new Controller();
