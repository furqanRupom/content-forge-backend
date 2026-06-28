import { Request, Response } from "express";
import status from "http-status";
import BaseController from "../../shared/baseController";
import { DashboardService } from "./dashboard.service";

class Controller extends BaseController {
  getOverview = this.catchAsync(async (req: Request, res: Response) => {
    const result = await DashboardService.getOverview(req.user);
    this.sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Dashboard overview fetched successfully",
      data: result,
    });
  });

  getChartData = this.catchAsync(async (req: Request, res: Response) => {
    const result = await DashboardService.getChartData(req.user, req.query as any);
    this.sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Chart data fetched successfully",
      data: result,
    });
  });

  getActivity = this.catchAsync(async (req: Request, res: Response) => {
    const result = await DashboardService.getActivity(req.user, req.query as any);
    this.sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Activity fetched successfully",
      data: result,
    });
  });

  getPerformanceMetrics = this.catchAsync(async (req: Request, res: Response) => {
    const result = await DashboardService.getPerformanceMetrics(req.user);
    this.sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Performance metrics fetched successfully",
      data: result,
    });
  });

  getContentLogsMetrics = this.catchAsync(async (req: Request, res: Response) => {
    const result = await DashboardService.getContentLogsMetrics(req.user);
    this.sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Content logs metrics fetched successfully",
      data: result,
    });
  });

  getUserPerformanceMetrics = this.catchAsync(async (req: Request, res: Response) => {
    const result = await DashboardService.getUserPerformanceMetrics(req.user, req.query as any);
    this.sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "User performance metrics fetched successfully",
      data: result,
    });
  });
}

export const DashboardController = new Controller();
