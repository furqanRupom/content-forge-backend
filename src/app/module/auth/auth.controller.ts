import BaseController from "../../shared/baseController";
import { Request, Response } from "express"
import { AuthService } from "./auth.service";
import status from "http-status"
import AppError from "../../errorHelpers/AppError";
import { tokenUtils } from "../../utils/token";
import { CookieUtils } from "../../utils/cookie";
import { envVars } from "../../config/env";
import { auth } from "../../lib/auth";

class Controller extends BaseController {
    register = this.catchAsync(async (req: Request, res: Response) => {
        const payload = req.body
        const result = await AuthService.register(payload)
        const { accessToken, refreshToken, token, ...rest } = result;

        tokenUtils.setAccessTokenCookie(res, accessToken)
        tokenUtils.setRefreshTokenCookie(res, refreshToken)
        tokenUtils.setBetterAuthSessionCookie(res, token as string)
        this.sendResponse(res, {
            statusCode: status.CREATED,
            success: true,
            message: "User Registerd successfully",
            data: result
        })
    })
    login = this.catchAsync(async (req: Request, res: Response) => {
        const payload = req.body
        const result = await AuthService.loginUser(payload);
        const { accessToken, refreshToken, token, ...rest } = result

        tokenUtils.setAccessTokenCookie(res, accessToken);
        tokenUtils.setRefreshTokenCookie(res, refreshToken);
        tokenUtils.setBetterAuthSessionCookie(res, token);
        this.sendResponse(res, {
            statusCode: status.OK,
            success: true,
            message: "User logged in successfully",
            data: result
        });
    });

    getMe = this.catchAsync(async (req: Request, res: Response) => {
        const result = await AuthService.getMe(req.user);
        this.sendResponse(res, {
            statusCode: status.OK,
            success: true,
            message: "User fetched successfully",
            data: result
        });
    });

    getNewToken = this.catchAsync(async (req: Request, res: Response) => {
        const refreshToken = req.cookies.refreshToken;
        const betterAuthSessionToken = req.cookies["better-auth.session_token"];
        if (!refreshToken) {
            throw new AppError(status.UNAUTHORIZED, "Refresh token is missing");
        }
        const result = await AuthService.getNewToken(refreshToken, betterAuthSessionToken);

        const { accessToken, refreshToken: newRefreshToken, sessionToken } = result;

        tokenUtils.setAccessTokenCookie(res, accessToken);
        tokenUtils.setRefreshTokenCookie(res, newRefreshToken);
        tokenUtils.setBetterAuthSessionCookie(res, sessionToken);

        this.sendResponse(res, {
            statusCode: status.OK,
            success: true,
            message: "New tokens generated successfully",
            data: result
        });
    });

    changePassword = this.catchAsync(async (req: Request, res: Response) => {
        const payload = req.body;
        const betterAuthSessionToken = req.cookies["better-auth.session_token"];

        const result = await AuthService.changePassword(payload, betterAuthSessionToken);

        const { accessToken, refreshToken, token } = result;

        tokenUtils.setAccessTokenCookie(res, accessToken);
        tokenUtils.setRefreshTokenCookie(res, refreshToken);
        tokenUtils.setBetterAuthSessionCookie(res, token as string);


        this.sendResponse(res, {
            statusCode: status.OK,
            success: true,
            message: "Password changed successfully",
            data: result
        });
    });

    logout = this.catchAsync(async (req: Request, res: Response) => {
        const betterAuthSessionToken = req.cookies["better-auth.session_token"];
        const result = await AuthService.logoutUser(betterAuthSessionToken);
        CookieUtils.clearCookie(res, 'accessToken', {
            httpOnly: true,
            secure: true,
            sameSite: "none",
        });
        CookieUtils.clearCookie(res, 'refreshToken', {
            httpOnly: true,
            secure: true,
            sameSite: "none",
        });
        CookieUtils.clearCookie(res, 'better-auth.session_token', {
            httpOnly: true,
            secure: true,
            sameSite: "none",
        });


        this.sendResponse(res, {
            statusCode: status.OK,
            success: true,
            message: "Logged out successfully",
            data: result
        });
    });

    verifyEmail = this.catchAsync(async (req: Request, res: Response) => {
        const { email, otp } = req.body;

        await AuthService.verifyEmail(email, otp);
        this.sendResponse(res, {
            statusCode: status.OK,
            success: true,
            message: "Email verified successfully",
            data: null
        });
    });

    forgotPassword = this.catchAsync(async (req: Request, res: Response) => {
        const { email } = req.body;

        await AuthService.forgotPassword(email);
        this.sendResponse(res, {
            statusCode: status.OK,
            success: true,
            message: "Password reset email sent successfully",
            data: null
        });
    });

    resetPassword = this.catchAsync(async (req: Request, res: Response) => {
        const { email, otp, newPassword } = req.body;

        await AuthService.resetPassword(email, otp, newPassword);
        this.sendResponse(res, {
            statusCode: status.OK,
            success: true,
            message: "Password reset successfully",
            data: null
        });
    });

    googleLogin = this.catchAsync(async(req:Request,res:Response) => {
        const redirectPath = req.query.redirect || "/dashboard";

        const encodedRedirectPath = encodeURIComponent(redirectPath as string);

        const callbackURL = `${envVars.BETTER_AUTH_URL}/api/v1/auth/google/success?redirect=${encodedRedirectPath}`;
        console.log({
          better_auth_url: envVars.BETTER_AUTH_URL
        })
        res.render("googleRedirect", {
            callbackURL: callbackURL,
            betterAuthUrl: envVars.BETTER_AUTH_URL,
        })
    })

    googleLoginSuccess = this.catchAsync(async (req: Request, res: Response) => {
        const redirectPath = req.query.redirect as string || "/dashboard";

        const sessionToken = req.cookies["better-auth.session_token"];

        if (!sessionToken) {
            return res.redirect(`${envVars.FRONTEND_URL}/login?error=oauth_failed`);
        }

        const session = await auth.api.getSession({
            headers: {
                "Cookie": `better-auth.session_token=${sessionToken}`
            }
        })

        if (!session) {
            return res.redirect(`${envVars.FRONTEND_URL}/login?error=no_session_found`);
        }


        if (session && !session.user) {
            return res.redirect(`${envVars.FRONTEND_URL}/login?error=no_user_found`);
        }

        const result = await AuthService.googleLoginSuccess(session);

        const { accessToken, refreshToken } = result;

        tokenUtils.setAccessTokenCookie(res, accessToken);
        tokenUtils.setRefreshTokenCookie(res, refreshToken);
        const isValidRedirectPath = redirectPath.startsWith("/") && !redirectPath.startsWith("//");
        const finalRedirectPath = isValidRedirectPath ? redirectPath : "/dashboard";

        res.redirect(`${envVars.FRONTEND_URL}${finalRedirectPath}`);
    });

       handleOAuthError = this.catchAsync(async(req: Request, res: Response) => {
        const error = req.query.error as string || "oauth_failed";
        res.redirect(`${envVars.FRONTEND_URL}/login?error=${error}`);
    })
}

export const AuthController = new Controller()
