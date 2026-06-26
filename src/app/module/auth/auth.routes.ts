import { Router } from "express";
import { AuthController } from "./auth.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { UserRole } from "../../../generated/prisma/enums";


const router = Router()

router.post("/register",AuthController.register)
router.post("/login",AuthController.login)

router.get("/me", checkAuth(UserRole.ADMIN, UserRole.USER, UserRole.MANAGER), AuthController.getMe)
router.post("/refresh-token", AuthController.getNewToken)
router.post("/change-password", checkAuth(UserRole.ADMIN, UserRole.USER, UserRole.MANAGER), AuthController.changePassword)
router.post("/logout", checkAuth(UserRole.ADMIN, UserRole.USER, UserRole.MANAGER), AuthController.logout)

router.post("/verify-email", AuthController.verifyEmail)
router.post("/forgot-password", AuthController.forgotPassword)
router.post("/reset-password", AuthController.resetPassword)

router.get("/login/google", AuthController.googleLogin);
router.get("/google/success", AuthController.googleLoginSuccess);
router.get("/oauth/error", AuthController.handleOAuthError);

export const AuthRouter = router;