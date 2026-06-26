import { Request, Response } from "express";
import status from "http-status";
import BaseController from "../../shared/baseController";
import { FavoriteService } from "./favorite.service";

class Controller extends BaseController {
    add = this.catchAsync(async (req: Request, res: Response) => {
        const { generatedContentId } = req.body;
        const result = await FavoriteService.addFavorite(generatedContentId, req.user);
        this.sendResponse(res, {
            statusCode: status.CREATED,
            success: true,
            message: "Added to favorites successfully",
            data: result,
        });
    });

    getAll = this.catchAsync(async (req: Request, res: Response) => {
        const result = await FavoriteService.getFavorites(req.user, req.query as any);
        this.sendResponse(res, {
            statusCode: status.OK,
            success: true,
            message: "Favorites fetched successfully",
            data: result,
        });
    });

    remove = this.catchAsync(async (req: Request, res: Response) => {
        const result = await FavoriteService.removeFavorite(req.params.id as string, req.user);
        this.sendResponse(res, {
            statusCode: status.OK,
            success: true,
            message: "Removed from favorites successfully",
            data: result,
        });
    });
}

export const FavoriteController = new Controller();