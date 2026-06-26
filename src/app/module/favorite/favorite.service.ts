import AppError from "../../errorHelpers/AppError";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { prisma } from "../../lib/prisma";
import status from "http-status";

class Service {
    async addFavorite(generatedContentId: string, user: IRequestUser) {
        // 1. Verify that the generated content exists and belongs to the user via the GenerationJob relation
        const content = await prisma.generatedContent.findFirst({
            where: {
                id: generatedContentId,
                job: {
                    userId: user.userId,
                },
            },
        });

        if (!content) {
            throw new AppError(status.NOT_FOUND, "Generated content not found");
        }

        // 2. Check if already favorited using the schema's composite unique constraint
        const existing = await prisma.favoriteContent.findUnique({
            where: {
                userId_generatedContentId: {
                    userId: user.userId,
                    generatedContentId,
                },
            },
        });

        if (existing) {
            throw new AppError(status.CONFLICT, "Already added to favorites");
        }

        // 3. Create the favorite and include the structure according to your schema
        const favorite = await prisma.favoriteContent.create({
            data: {
                userId: user.userId,
                generatedContentId,
            },
            include: {
                generatedContent: {
                    select: {
                        id: true,
                        title: true,
                        outputText: true,
                        wordCount: true,
                        createdAt: true,
                        job: {
                            select: {
                                id: true,
                                model: true,
                                tokensUsed: true,
                                template: { select: { id: true, title: true } },
                            },
                        },
                    },
                },
            },
        });

        return favorite;
    }

    async getFavorites(user: IRequestUser, query: { page?: number; limit?: number }) {
        const { page = 1, limit = 10 } = query;
        const skip = (Number(page) - 1) * Number(limit);

        const [favorites, total] = await Promise.all([
            prisma.favoriteContent.findMany({
                where: { userId: user.userId },
                skip,
                take: Number(limit),
                orderBy: { createdAt: "desc" },
                include: {
                    generatedContent: {
                        select: {
                            id: true,
                            title: true,
                            outputText: true,
                            wordCount: true,
                            createdAt: true,
                            job: {
                                select: {
                                    id: true,
                                    model: true,
                                    tokensUsed: true,
                                    status: true,
                                    template: { select: { id: true, title: true } },
                                },
                            },
                        },
                    },
                },
            }),
            prisma.favoriteContent.count({ where: { userId: user.userId } }),
        ]);

        return {
            favorites,
            meta: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
            },
        };
    }

    async removeFavorite(id: string, user: IRequestUser) {
        // Enforce that users can only delete their own favorites
        const favorite = await prisma.favoriteContent.findFirst({
            where: { id, userId: user.userId },
        });

        if (!favorite) {
            throw new AppError(status.NOT_FOUND, "Favorite not found");
        }

        await prisma.favoriteContent.delete({ where: { id } });

        return { id };
    }
}

export const FavoriteService = new Service();