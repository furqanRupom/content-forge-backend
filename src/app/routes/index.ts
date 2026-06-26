import {Router} from "express"
import { AuthRouter } from "../module/auth";
import { TemplateRouter } from "../module/template";
import { GenerationRouter } from "../module/generation";
import { FavoriteRouter } from "../module/favorite";
const router = Router()

router.use("/auth",AuthRouter)
router.use("/template",TemplateRouter)
router.use("/generation",GenerationRouter)
router.use("/favorite",FavoriteRouter)

export const IndexRoutes = router;
