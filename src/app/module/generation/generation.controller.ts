// src/app/module/generations/generations.controller.ts
import { Request, Response } from "express";
import status from "http-status";
import BaseController from "../../shared/baseController";
import { GenerationService } from "./generation.service";

class Controller extends BaseController {
    create = this.catchAsync(async (req: Request, res: Response) => {
        const result = await GenerationService.createGeneration(req.body, req.user);
        this.sendResponse(res, {
            statusCode: status.CREATED,
            success: true,
            message: "Generation created successfully",
            data: result,
        });
    });

    getAll = this.catchAsync(async (req: Request, res: Response) => {
        const result = await GenerationService.getAllGenerations(req.query as any, req.user);
        this.sendResponse(res, {
            statusCode: status.OK,
            success: true,
            message: "Generations fetched successfully",
            meta:result.meta,
            data: result.data
        });
    });

    getById = this.catchAsync(async (req: Request, res: Response) => {
        const result = await GenerationService.getGenerationById(req.params.id as string, req.user);
        this.sendResponse(res, {
            statusCode: status.OK,
            success: true,
            message: "Generation fetched successfully",
            data: result,
        });
    });

    update = this.catchAsync(async (req: Request, res: Response) => {
        const result = await GenerationService.updateGeneration(req.params.id as string, req.body, req.user);
        this.sendResponse(res, {
            statusCode: status.OK,
            success: true,
            message: "Generation updated successfully",
            data: result,
        });
    });

    delete = this.catchAsync(async (req: Request, res: Response) => {
        const result = await GenerationService.deleteGeneration(req.params.id as string, req.user);
        this.sendResponse(res, {
            statusCode: status.OK,
            success: true,
            message: "Generation deleted successfully",
            data: result,
        });
    });

    regenerate = this.catchAsync(async (req: Request, res: Response) => {
        const result = await GenerationService.regenerate(req.params.id as string, req.user);
        this.sendResponse(res, {
            statusCode: status.OK,
            success: true,
            message: "Generation regenerated successfully",
            data: result,
        });
    });
}

export const GenerationController = new Controller();
