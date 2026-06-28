import { TemplateType, UserRole } from "../../generated/prisma/enums";
import { envVars } from "../config/env";
import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";

export const seedManager = async () => {
    try {
        const isManagerExit = await prisma.user.findFirst({
            where:{
                role : UserRole.MANAGER
            }
        })

        if(isManagerExit) {
            console.log("Manager already exists. Skipping seeding Manager.");
            return;
        }

        const managerUser = await auth.api.signUpEmail({
            body:{
                email : envVars.DEFAULT_MANAGER_EMAIL,
                password : envVars.DEFAULT_MANAGER_PASSWORD,
                name : "Forge Manager",
                role : UserRole.MANAGER,
                rememberMe : false,
            }
        })

            await prisma.user.update({
                where : {
                    id : managerUser.user.id
                },
                data : {
                    emailVerified : true,
                }
            });


    } catch (error) {
        console.error("Error seeding super admin: ", error);
        await prisma.user.delete({
            where : {
                email : envVars.SUPER_ADMIN_EMAIL,
            }
        })
    }
}
export const seedTemplates = async () => {
    try {
        // High-quality mock items covering key branches of your TemplateType enum
        const templatesData = [
            // --- Social Media ---
            {
                key: "sm-linkedin-growth",
                title: "Thought Leadership LinkedIn Post",
                description: "Craft an engaging professional narrative optimized for conversions and reach on LinkedIn.",
                type: TemplateType.LINKEDIN_POST,
                category: "Social Media",
                promptHint: "What is the core breakthrough or lesson you learned this week?",
            },
            {
                key: "sm-x-thread-viral",
                title: "Viral X/Twitter Thread Hook & Body",
                description: "Format a high-retention multi-tweet sequence built around hooks, frameworks, and a CTA.",
                type: TemplateType.TWITTER_THREAD,
                category: "Social Media",
                promptHint: "Provide the primary hook topic and 3 core value-add subpoints.",
            },
            {
                key: "sm-insta-caption",
                title: "Instagram Storytelling Caption",
                description: "Generate punchy, short captions designed to increase saves and drive community engagement.",
                type: TemplateType.INSTAGRAM_CAPTION,
                category: "Social Media",
                promptHint: "Describe the image or video asset you are publishing.",
            },

            // --- Blogging ---
            {
                key: "blog-outline-seo",
                title: "Comprehensive Blog Outline Builder",
                description: "Generate standard H2/H3 semantic layouts optimized for reader retention and search intent.",
                type: TemplateType.BLOG_OUTLINE,
                category: "Blogging",
                promptHint: "What is the targeted keyword or main title idea?",
            },
            {
                key: "blog-intro-hook",
                title: "PAS Blog Introduction Framework",
                description: "Write an introductory paragraph using the Problem-Agitate-Solve copywriting standard.",
                type: TemplateType.BLOG_INTRODUCTION,
                category: "Blogging",
                promptHint: "What pain point are you solving for your reader?",
            },

            // --- SEO ---
            {
                key: "seo-meta-optimizer",
                title: "Meta Title & Description Generator",
                description: "Build clean metadata strings conforming strictly to pixel length limits (60/160 chars).",
                type: TemplateType.META_DESCRIPTION,
                category: "SEO",
                promptHint: "Paste target URLs or target long-tail keywords.",
            },

            // --- Marketing ---
            {
                key: "mkt-landing-hero",
                title: "Landing Page Above-The-Fold Copy",
                description: "Create structured combinations of Hero Headlines, Subheadlines, and CTA buttons.",
                type: TemplateType.LANDING_PAGE,
                category: "Marketing",
                promptHint: "Describe your product value proposition in simple terms.",
            },
            {
                key: "mkt-facebook-ads",
                title: "High-ROI Facebook Dynamic Ad Copy",
                description: "Build conversion-focused variants including short hooks, long angles, and clear headers.",
                type: TemplateType.AD_COPY,
                category: "Marketing",
                promptHint: "What is your promotional offer or lead magnet?",
            },

            // --- Sales ---
            {
                key: "sales-cold-outreach",
                title: "Personalized Cold Email Generator",
                description: "Develop lightweight, hyper-targeted sales templates designed to optimize meeting booking rates.",
                type: TemplateType.COLD_EMAIL,
                category: "Sales",
                promptHint: "Provide your product, value prop, and details about the recipient's business niche.",
            },

            // --- Email ---
            {
                key: "email-welcome-series",
                title: "SaaS Onboarding Welcome Email",
                description: "Draft an engaging welcome email to greet newly registered users and guide them to immediate activation.",
                type: TemplateType.WELCOME_EMAIL,
                category: "Email",
                promptHint: "What is the primary action step the new subscriber should take first?",
            },

            // --- Business ---
            {
                key: "biz-exec-summary",
                title: "Investor Pitch Executive Summary",
                description: "Synthesize large business objectives into crisp, concise one-page investor readouts.",
                type: TemplateType.EXECUTIVE_SUMMARY,
                category: "Business",
                promptHint: "Paste notes on the problem, market size, business solution, and traction metrics.",
            },

            // --- Documentation ---
            {
                key: "doc-readme-github",
                title: "Standard GitHub README Generator",
                description: "Produce a modern open-source repository readme incorporating setup steps and shields.",
                type: TemplateType.README,
                category: "Documentation",
                promptHint: "Provide library name, stack used, and brief setup installation commands.",
            },

            // --- Development ---
            {
                key: "dev-code-explain",
                title: "Clean Code Logic Explainer",
                description: "Break down complex functional blocks or legacy operations into easy-to-read architectural bullet points.",
                type: TemplateType.CODE_EXPLANATION,
                category: "Development",
                promptHint: "Paste the raw code snippet you want explained.",
            },
            {
                key: "dev-git-commit",
                title: "Conventional Commit Generator",
                description: "Turn casual descriptions of your workspace modifications into structured Semantic Commit logs.",
                type: TemplateType.COMMIT_MESSAGE,
                category: "Development",
                promptHint: "What raw changes or file updates did you make?",
            },

            // --- Education ---
            {
                key: "edu-flashcard-qa",
                title: "Automated Study Flashcard Deck",
                description: "Isolate central items from instructional texts and reformulate them into highly retentive Q&A configurations.",
                type: TemplateType.FLASHCARDS,
                category: "Education",
                promptHint: "Provide the chapter summary or topic text.",
            },

            // --- Creative ---
            {
                key: "crt-short-outline",
                title: "Fiction Worldbuilding Outline",
                description: "Map key three-act structures, emotional dynamic turning points, and major environment rules.",
                type: TemplateType.BOOK_OUTLINE,
                category: "Creative",
                promptHint: "What is your main premise, theme, and genre?",
            },

            // --- Productivity ---
            {
                key: "prod-meeting-actions",
                title: "Transcript Action Item Extractor",
                description: "Filter messy audio notes or meeting files down into explicit tasks assigned to timelines.",
                type: TemplateType.ACTION_ITEMS,
                category: "Productivity",
                promptHint: "Paste the conversation transcript or unformatted meeting wrap-up notes.",
            },

            // --- E-commerce ---
            {
                key: "ecom-amazon-listing",
                title: "High-Ranking Amazon Bullet Points",
                description: "Write SEO-heavy asset matrices using structural patterns favored by digital index crawlers.",
                type: TemplateType.AMAZON_LISTING,
                category: "E-commerce",
                promptHint: "Provide the item features, name, and your target primary keywords.",
            },

            // --- Customer Support ---
            {
                key: "support-kb-article",
                title: "Step-by-Step Knowledge Base Article",
                description: "Structure standard internal wiki guides providing simple solutions to customer trouble vectors.",
                type: TemplateType.KNOWLEDGE_BASE,
                category: "Customer Support",
                promptHint: "What feature or issue is this troubleshooting manual addressing?",
            },

            // --- Research ---
            {
                key: "res-whitepaper-abstract",
                title: "Technical Whitepaper Summary",
                description: "Compress long form data points into high-authority summaries suitable for industry sharing.",
                type: TemplateType.WHITEPAPER,
                category: "Research",
                promptHint: "Provide data findings or deep-dive operational texts.",
            },
        ];

        // Generate the rest programmatically to quickly hit 100 entries across your enum categories
        const remainingEnumValues = Object.values(TemplateType).filter(
            (t) => !templatesData.map((d) => d.type).includes(t as any)
        );

        let autoIndex = 1;
        for (const enumValue of remainingEnumValues) {
            // Transform enum keys (e.g., "HELP_CENTER_ARTICLE" -> "Help Center Article")
            const formattedName = enumValue
                .toLowerCase()
                .replace(/_/g, " ")
                .replace(/\b\w/g, (char) => char.toUpperCase());

            templatesData.push({
                key: `gen-auto-${enumValue.toLowerCase().replace(/_/g, "-")}`,
                title: `${formattedName} Helper`,
                description: `Standard assistant optimized for processing configurations for ${formattedName} workflows.`,
                type: enumValue as any,
                category: "General Utility",
                promptHint: "Provide key reference context or details you want organized.",
            });
            autoIndex++;
        }

        // Cap array safely at exactly 100 records if desired, or let it load all remaining enums
        const finalPayload = templatesData.slice(0, 100);

        const result = await prisma.template.createMany({
            data: finalPayload,
            skipDuplicates: true, // Safeguard against re-running errors
        });

        console.log(`Successfully seeded ${result.count} new unique templates.`);
    } catch (error) {
        console.error("Error seeding templates: ", error);
    }
};
