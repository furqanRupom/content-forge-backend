import { IRequestUser } from "../../interfaces/requestUser.interface";
import { prisma } from "../../lib/prisma";
import { UserRole } from "../../../generated/prisma/enums";

class Service {
    async getOverview(user: IRequestUser) {
        const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.MANAGER;
        const userFilter = isAdmin ? {} : { userId: user.userId };

        const [
            totalGenerations,
            completedGenerations,
            failedGenerations,
            totalFavorites,
            totalTemplates,
            totalUsers,
            tokensAgg,
        ] = await Promise.all([
            prisma.generationJob.count({ where: userFilter }),
            prisma.generationJob.count({ where: { ...userFilter, status: "COMPLETED" } }),
            prisma.generationJob.count({ where: { ...userFilter, status: "FAILED" } }),
            prisma.favoriteContent.count({ where: isAdmin ? {} : { userId: user.userId } }),
            prisma.template.count(),
            isAdmin ? prisma.user.count() : Promise.resolve(null),
            prisma.generationJob.aggregate({
                where: { ...userFilter, status: "COMPLETED" },
                _sum: { tokensUsed: true },
            }),
        ]);

        const result: Record<string, any> = {
            totalGenerations,
            completedGenerations,
            failedGenerations,
            successRate: totalGenerations > 0
                ? Math.round((completedGenerations / totalGenerations) * 100)
                : 0,
            totalFavorites,
            totalTemplates,
            totalTokensUsed: tokensAgg._sum.tokensUsed || 0,
        };

        if (isAdmin) result.totalUsers = totalUsers;

        return result;
    }

    async getChartData(user: IRequestUser, query: { period?: string }) {
        const { period = "7d" } = query;
        const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.MANAGER;
        const periodMap: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };
        const days = periodMap[period] || 7;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const userFilter = isAdmin ? {} : { userId: user.userId };

        const jobs = await prisma.generationJob.findMany({
            where: { ...userFilter, createdAt: { gte: startDate } },
            select: { createdAt: true, status: true, tokensUsed: true },
            orderBy: { createdAt: "asc" },
        });

        const buckets: Record<string, { date: string; total: number; completed: number; failed: number; tokens: number }> = {};

        for (let i = 0; i < days; i++) {
            const d = new Date();
            d.setDate(d.getDate() - (days - 1 - i));
            const key = d.toISOString().split("T")[0];
            buckets[key] = { date: key, total: 0, completed: 0, failed: 0, tokens: 0 };
        }

        for (const job of jobs) {
            const key = job.createdAt.toISOString().split("T")[0];
            if (buckets[key]) {
                buckets[key].total++;
                if (job.status === "COMPLETED") buckets[key].completed++;
                if (job.status === "FAILED") buckets[key].failed++;
                buckets[key].tokens += job.tokensUsed || 0;
            }
        }

        return { period, data: Object.values(buckets) };
    }

    async getActivity(user: IRequestUser, query: { page?: number; limit?: number }) {
        const { page = 1, limit = 20 } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.MANAGER;
        const userFilter = isAdmin ? {} : { userId: user.userId };

        const [recentJobs, recentFavorites, total] = await Promise.all([
            prisma.generationJob.findMany({
                where: userFilter,
                orderBy: { createdAt: "desc" },
                take: Number(limit),
                skip,
                select: {
                    id: true,
                    inputPrompt: true,
                    status: true,
                    model: true,
                    tokensUsed: true,
                    createdAt: true,
                    template: { select: { id: true, title: true } },
                    generatedContent: { select: { id: true, title: true, wordCount: true } },
                    ...(isAdmin && { user: { select: { id: true, name: true, email: true } } }),
                },
            }),
            prisma.favoriteContent.findMany({
                where: isAdmin ? {} : { userId: user.userId },
                orderBy: { createdAt: "desc" },
                take: 5,
                select: {
                    id: true,
                    createdAt: true,
                    generatedContent: {
                        select: {
                            id: true,
                            title: true,
                            job: { select: { inputPrompt: true } }
                        }
                    },
                },
            }),
            prisma.generationJob.count({ where: userFilter }),
        ]);

        return {
            recentGenerations: recentJobs,
            recentFavorites,
            meta: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
            },
        };
    }

    // NEW ADDITION: Analytics endpoint for breakdown data
    async getPerformanceMetrics(user: IRequestUser) {
        const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.MANAGER;
        const userFilter = isAdmin ? {} : { userId: user.userId };

        // Top templates used
        const popularTemplates = await prisma.generationJob.groupBy({
            by: ['templateId'],
            where: userFilter,
            _count: {
                id: true
            },
            orderBy: {
                _count: {
                    id: 'desc'
                }
            },
            take: 5
        });

        // Resolve template titles manually to save join cost on aggregation
        const templateIds = popularTemplates.map(t => t.templateId);
        const templates = await prisma.template.findMany({
            where: { id: { in: templateIds } },
            select: { id: true, title: true }
        });

        const topTemplates = popularTemplates.map(item => ({
            count: item._count.id,
            ...templates.find(t => t.id === item.templateId)
        }));

        // Model distributions
        const modelDistribution = await prisma.generationJob.groupBy({
            by: ['model'],
            where: userFilter,
            _count: { id: true },
            _sum: { tokensUsed: true }
        });

        return {
            topTemplates,
            modelDistribution: modelDistribution.map(m => ({
                model: m.model,
                usageCount: m._count.id,
                totalTokens: m._sum.tokensUsed || 0
            }))
        };
    }
}

export const DashboardService = new Service();