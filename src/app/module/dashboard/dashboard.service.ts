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


async getContentLogsMetrics(user: IRequestUser) {
        const isAuthorized = user.role === UserRole.ADMIN || user.role === UserRole.MANAGER;
        if (!isAuthorized) {
            throw new Error("Unauthorized access footprint path blocked");
        }

        // Get total breakdown, running pipeline queues, and recent historical payload generations
        const [totalRuns, processingRuns, failedRuns, recentLogs] = await Promise.all([
            prisma.generationJob.count(),
            prisma.generationJob.count({ where: { status: { in: ["PROCESSING", "QUEUED"] } } }),
            prisma.generationJob.count({ where: { status: "FAILED" } }),
            prisma.generationJob.findMany({
                orderBy: { createdAt: "desc" },
                take: 10,
                select: {
                    id: true,
                    model: true,
                    status: true,
                    createdAt: true,
                    inputPrompt: true,
                    user: { select: { name: true, email: true } },
                    generatedContent: { select: { title: true, wordCount: true } }
                }
            })
        ]);

        return {
            summary: {
                totalRuns,
                processingRuns,
                failedRuns,
                stabilityRate: totalRuns > 0 
                    ? Math.round(((totalRuns - failedRuns) / totalRuns) * 100) 
                    : 100
            },
            recentLogs
        };
    }
    async getUserPerformanceMetrics(user: IRequestUser, query: { period?: string } = {}) {
        const isAuthorized = user.role === UserRole.ADMIN || user.role === UserRole.MANAGER;
        if (!isAuthorized) {
            throw new Error("Unauthorized access footprint path blocked");
        }

        const { period = "30d" } = query;
        const periodMap: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };
        const days = periodMap[period] || 30;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Fetch user distribution and structural group calculations concurrently
        const [roleDistribution, totalUsers, newUsersCount, historicalRegistrations] = await Promise.all([
            prisma.user.groupBy({
                by: ['role'],
                _count: { id: true }
            }),
            prisma.user.count(),
            prisma.user.count({
                where: { createdAt: { gte: startDate } }
            }),
            prisma.user.findMany({
                where: { createdAt: { gte: startDate } },
                select: { createdAt: true },
                orderBy: { createdAt: "asc" }
            })
        ]);

        // Construct linear dynamic chronological line charts for user registration velocity
        const userGrowthBuckets: Record<string, number> = {};
        for (let i = 0; i < days; i++) {
            const d = new Date();
            d.setDate(d.getDate() - (days - 1 - i));
            const key = d.toISOString().split("T")[0];
            userGrowthBuckets[key] = 0;
        }

        for (const account of historicalRegistrations) {
            const key = account.createdAt.toISOString().split("T")[0];
            if (userGrowthBuckets[key] !== undefined) {
                userGrowthBuckets[key]++;
            }
        }

        return {
            summary: {
                totalUsers,
                newUsersCount,
                growthPercentage: totalUsers > 0 
                    ? Math.round((newUsersCount / (totalUsers - newUsersCount || 1)) * 100) 
                    : 0
            },
            roles: roleDistribution.map(r => ({
                role: r.role,
                count: r._count.id
            })),
            growthTimeline: Object.entries(userGrowthBuckets).map(([date, registrations]) => ({
                date,
                registrations
            }))
        };
    }    
}

export const DashboardService = new Service();
