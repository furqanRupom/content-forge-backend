import AppError from "../../errorHelpers/AppError";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { auth } from "../../lib/auth";
import status from "http-status"
import { IChangePasswordPayload, ILoginUserPayload, IRegisterUserPayload } from "./auth.interface";
import { prisma } from "../../lib/prisma";
import { tokenUtils } from "../../utils/token";
import { UserStatus } from "../../../generated/prisma/enums";
import { JwtPayload } from "jsonwebtoken";
import { jwtUtils } from "../../utils/jwt";
import { envVars } from "../../config/env";

class Service {

    async register(payload:IRegisterUserPayload){
        const { name, email, password } = payload;

        const data = await auth.api.signUpEmail({
            body: {
                name,
                email,
                password,
            }
        })

        if (!data.user) {
            throw new AppError(status.BAD_REQUEST, "Failed to register patient");
        }

        try {
         

            const accessToken = tokenUtils.getAccessToken({
                userId: data.user.id,
                role: data.user.role,
                name: data.user.name,
                email: data.user.email,
                status: data.user.status,
                isDeleted: data.user.isDeleted,
                emailVerified: data.user.emailVerified,
            });

            const refreshToken = tokenUtils.getRefreshToken({
                userId: data.user.id,
                role: data.user.role,
                name: data.user.name,
                email: data.user.email,
                status: data.user.status,
                isDeleted: data.user.isDeleted,
                emailVerified: data.user.emailVerified,
            });

            return {
                ...data,
                accessToken,
                refreshToken,
            }

        } catch (error) {
            console.log("Transaction error : ", error);
            await prisma.user.delete({
                where: {
                    id: data.user.id
                }
            })
            throw error;
        }
    }

    async loginUser(payload:ILoginUserPayload){
        const { email, password } = payload;

        const data = await auth.api.signInEmail({
            body: {
                email,
                password,
            }
        })

        if (data.user.status === UserStatus.BLOCKED) {
            throw new AppError(status.FORBIDDEN, "User is blocked");
        }

        if (data.user.isDeleted || data.user.status === UserStatus.DELETED) {
            throw new AppError(status.NOT_FOUND, "User is deleted");
        }

        const accessToken = tokenUtils.getAccessToken({
            userId: data.user.id,
            role: data.user.role,
            name: data.user.name,
            email: data.user.email,
            status: data.user.status,
            isDeleted: data.user.isDeleted,
            emailVerified: data.user.emailVerified,
        });

        const refreshToken = tokenUtils.getRefreshToken({
            userId: data.user.id,
            role: data.user.role,
            name: data.user.name,
            email: data.user.email,
            status: data.user.status,
            isDeleted: data.user.isDeleted,
            emailVerified: data.user.emailVerified,
        });

        return {
            ...data,
            accessToken,
            refreshToken,
        };
    }

    async getMe(payload:IRequestUser) {
        const isUserExists = await prisma.user.findUnique({
            where: {
                id: payload.userId,
            },
            omit:{
                password:true
            }
        })
        if (!isUserExists) {
            throw new AppError(status.NOT_FOUND, "User not found");
        }

        return isUserExists;
    }

    async getNewToken(refreshToken: string, sessionToken:string) {
        const isSessionTokenExists = await prisma.session.findUnique({
            where: {
                token: sessionToken,
            },
            include: {
                user: true,
            }
        })

        if (!isSessionTokenExists) {
            throw new AppError(status.UNAUTHORIZED, "Invalid session token");
        }

        const verifiedRefreshToken = jwtUtils.verifyToken(refreshToken, envVars.REFRESH_TOKEN_SECRET)


        if (!verifiedRefreshToken.success && verifiedRefreshToken.error) {
            throw new AppError(status.UNAUTHORIZED, "Invalid refresh token");
        }

        const data = verifiedRefreshToken.data as JwtPayload;

        const newAccessToken = tokenUtils.getAccessToken({
            userId: data.userId,
            role: data.role,
            name: data.name,
            email: data.email,
            status: data.status,
            isDeleted: data.isDeleted,
            emailVerified: data.emailVerified,
        });

        const newRefreshToken = tokenUtils.getRefreshToken({
            userId: data.userId,
            role: data.role,
            name: data.name,
            email: data.email,
            status: data.status,
            isDeleted: data.isDeleted,
            emailVerified: data.emailVerified,
        });

        const { token } = await prisma.session.update({
            where: {
                token: sessionToken
            },
            data: {
                token: sessionToken,
                expiresAt: new Date(Date.now() + 60 * 60 * 60 * 24 * 1000),
                updatedAt: new Date(),
            }
        })

        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            sessionToken: token,
        }
    }

    async changePassword(payload:IChangePasswordPayload,sessionToken:string){
        const session = await auth.api.getSession({
            headers: new Headers({
                Authorization: `Bearer ${sessionToken}`
            })
        })

        if (!session) {
            throw new AppError(status.UNAUTHORIZED, "Invalid session token");
        }

        const { currentPassword, newPassword } = payload;

        const result = await auth.api.changePassword({
            body: {
                currentPassword,
                newPassword,
                revokeOtherSessions: true,
            },
            headers: new Headers({
                Authorization: `Bearer ${sessionToken}`
            })
        })

        if (session.user.needPasswordChange) {
            await prisma.user.update({
                where: {
                    id: session.user.id,
                },
                data: {
                    needPasswordChange: false,
                }
            })
        }

        const accessToken = tokenUtils.getAccessToken({
            userId: session.user.id,
            role: session.user.role,
            name: session.user.name,
            email: session.user.email,
            status: session.user.status,
            isDeleted: session.user.isDeleted,
            emailVerified: session.user.emailVerified,
        });

        const refreshToken = tokenUtils.getRefreshToken({
            userId: session.user.id,
            role: session.user.role,
            name: session.user.name,
            email: session.user.email,
            status: session.user.status,
            isDeleted: session.user.isDeleted,
            emailVerified: session.user.emailVerified,
        });


        return {
            ...result,
            accessToken,
            refreshToken,
        }
    }

    async logoutUser(sessionToken:string){
        const result = await auth.api.signOut({
            headers: new Headers({
                Authorization: `Bearer ${sessionToken}`
            })
        })

        return result;
    }

    async verifyEmail(email:string, otp:string) {
        const result = await auth.api.verifyEmailOTP({
            body: {
                email,
                otp,
            }
        })

        if (result.status && !result.user.emailVerified) {
            await prisma.user.update({
                where: {
                    email,
                },
                data: {
                    emailVerified: true,
                }
            })
        }
    }

    async forgotPassword( email:string){
        const isUserExist = await prisma.user.findUnique({
            where: {
                email,
            }
        })

        if (!isUserExist) {
            throw new AppError(status.NOT_FOUND, "User not found");
        }

        if (!isUserExist.emailVerified) {
            throw new AppError(status.BAD_REQUEST, "Email not verified");
        }

        if (isUserExist.isDeleted || isUserExist.status === UserStatus.DELETED) {
            throw new AppError(status.NOT_FOUND, "User not found");
        }

        await auth.api.requestPasswordResetEmailOTP({
            body: {
                email,
            }
        })
    }

    async resetPassword(email:string,otp:string,newPassword:string){
        const isUserExist = await prisma.user.findUnique({
            where: {
                email,
            }
        })

        if (!isUserExist) {
            throw new AppError(status.NOT_FOUND, "User not found");
        }

        if (!isUserExist.emailVerified) {
            throw new AppError(status.BAD_REQUEST, "Email not verified");
        }

        if (isUserExist.isDeleted || isUserExist.status === UserStatus.DELETED) {
            throw new AppError(status.NOT_FOUND, "User not found");
        }

        await auth.api.resetPasswordEmailOTP({
            body: {
                email,
                otp,
                password: newPassword,
            }
        })

       

        await prisma.session.deleteMany({
            where: {
                userId: isUserExist.id,
            }
        })
    }

    async googleLoginSuccess(session: Record<string, any>) {
        if (!session?.user?.id) {
            throw new AppError(status.UNAUTHORIZED, "Invalid Google session");
        }

        const user = session.user;

        let dbUser = await prisma.user.findUnique({
            where: { id: user.id }
        });

        if (!dbUser) {
            dbUser = await prisma.user.create({
                data: {
                    id: user.id,
                    name: user.name || "Google User",
                    email: user.email!,
                    emailVerified: true,        
                    password: "",                  
                    role: user.role || "USER",
                    status: UserStatus.ACTIVE,
                    isDeleted: false,
                }
            });
        }

        else if (dbUser.name !== user.name || dbUser.email !== user.email) {
            dbUser = await prisma.user.update({
                where: { id: user.id },
                data: {
                    name: user.name,
                    email: user.email,
                }
            });
        }

        if (dbUser.status === UserStatus.BLOCKED) {
            throw new AppError(status.FORBIDDEN, "User is blocked");
        }

        if (dbUser.isDeleted || dbUser.status === UserStatus.DELETED) {
            throw new AppError(status.NOT_FOUND, "User is deleted");
        }

        const accessToken = tokenUtils.getAccessToken({
            userId: dbUser.id,
            role: dbUser.role,
            name: dbUser.name,
            email: dbUser.email,
            status: dbUser.status,
            isDeleted: dbUser.isDeleted,
            emailVerified: dbUser.emailVerified,
        });

        const refreshToken = tokenUtils.getRefreshToken({
            userId: dbUser.id,
            role: dbUser.role,
            name: dbUser.name,
            email: dbUser.email,
            status: dbUser.status,
            isDeleted: dbUser.isDeleted,
            emailVerified: dbUser.emailVerified,
        });

        return {
            accessToken,
            refreshToken,
            user: {
                id: dbUser.id,
                name: dbUser.name,
                email: dbUser.email,
                role: dbUser.role,
                emailVerified: dbUser.emailVerified,
            }
        };
    }
}

export const AuthService = new Service()