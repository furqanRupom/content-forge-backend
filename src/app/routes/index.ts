import {Router} from "express"
import { AuthRouter } from "../module/auth";
import { TemplateRouter } from "../module/template";
import { GenerationRouter } from "../module/generation";
const router = Router()

router.use("/auth",AuthRouter)
router.use("/template",TemplateRouter)
router.use("/generation",GenerationRouter)

export const IndexRoutes = router;
