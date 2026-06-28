import { Router } from "express";
import { DashboardController } from "./dashboard.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { UserRole } from "../../../generated/prisma/enums";

const router = Router();

const allRoles = checkAuth(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER);

router.get("/overview", allRoles, DashboardController.getOverview);
router.get("/chart-data", allRoles, DashboardController.getChartData);
router.get("/activity", allRoles, DashboardController.getActivity);
router.get("/metrics", allRoles, DashboardController.getPerformanceMetrics); 

router.get("/content-logs", checkAuth(UserRole.MANAGER), DashboardController.getContentLogsMetrics);
router.get("/user-metrics", checkAuth(UserRole.MANAGER), DashboardController.getUserPerformanceMetrics);
export const DashboardRouter = router;
