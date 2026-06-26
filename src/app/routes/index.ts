import {Router} from "express"
import { AuthRouter } from "../module/auth";
const router = Router()

router.use("/auth",AuthRouter)
export const IndexRoutes = router;
