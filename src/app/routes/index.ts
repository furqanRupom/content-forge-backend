import {Router} from "express"
import { AuthRouter } from "../module/auth";
import { TemplateRouter } from "../module/template";
import { GenerationRouter } from "../module/generation";
import { FavoriteRouter } from "../module/favorite";
import { DashboardRouter } from "../module/dashboard/dashboard.routs";
const router = Router()

router.use("/auth",AuthRouter)
router.use("/template",TemplateRouter)
router.use("/generation",GenerationRouter)
router.use("/favorite",FavoriteRouter)
router.use("/dashboard",DashboardRouter)

export const IndexRoutes = router;
