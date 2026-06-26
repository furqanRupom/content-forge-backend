-- CreateEnum
CREATE TYPE "GenerationStatus" AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "TemplateType" AS ENUM ('LINKEDIN_POST', 'X_POST', 'TWITTER_THREAD', 'FACEBOOK_POST', 'INSTAGRAM_CAPTION', 'TIKTOK_CAPTION', 'YOUTUBE_DESCRIPTION', 'REDDIT_POST', 'PINTEREST_DESCRIPTION', 'BLOG_DRAFT', 'BLOG_OUTLINE', 'BLOG_INTRODUCTION', 'BLOG_CONCLUSION', 'ARTICLE', 'NEWSLETTER', 'GUEST_POST', 'SEO_ARTICLE', 'META_TITLE', 'META_DESCRIPTION', 'FAQ', 'KEYWORD_CLUSTER', 'SEO_BRIEF', 'LANDING_PAGE', 'AD_COPY', 'SALES_COPY', 'MARKETING_COPY', 'PROMOTIONAL_CONTENT', 'CALL_TO_ACTION', 'BRAND_STORY', 'SALES_EMAIL', 'COLD_EMAIL', 'FOLLOW_UP_EMAIL', 'SALES_SCRIPT', 'PRODUCT_PITCH', 'EMAIL', 'EMAIL_SEQUENCE', 'EMAIL_SUBJECT', 'WELCOME_EMAIL', 'ANNOUNCEMENT_EMAIL', 'BUSINESS_PROPOSAL', 'BUSINESS_PLAN', 'CASE_STUDY', 'EXECUTIVE_SUMMARY', 'MEETING_SUMMARY', 'REPORT', 'PRESS_RELEASE', 'DOCUMENTATION', 'API_DOCUMENTATION', 'README', 'CHANGELOG', 'RELEASE_NOTES', 'USER_GUIDE', 'CODE_EXPLANATION', 'CODE_REVIEW', 'CODE_GENERATION', 'DEBUGGING', 'COMMIT_MESSAGE', 'PULL_REQUEST_DESCRIPTION', 'BUG_REPORT', 'TECHNICAL_SPECIFICATION', 'STUDY_NOTES', 'LESSON_PLAN', 'QUIZ', 'FLASHCARDS', 'EXPLANATION', 'TUTORIAL', 'STORY', 'SHORT_STORY', 'POEM', 'SCRIPT', 'CHARACTER_DESCRIPTION', 'BOOK_OUTLINE', 'SUMMARY', 'ACTION_ITEMS', 'CHECKLIST', 'TODO_LIST', 'BRAINSTORM', 'IDEA_GENERATION', 'PRODUCT_DESCRIPTION', 'AMAZON_LISTING', 'SHOPIFY_DESCRIPTION', 'CATEGORY_DESCRIPTION', 'SUPPORT_REPLY', 'KNOWLEDGE_BASE', 'HELP_CENTER_ARTICLE', 'CHAT_RESPONSE', 'RESEARCH_SUMMARY', 'LITERATURE_REVIEW', 'WHITEPAPER');

-- CreateTable
CREATE TABLE "generationJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "inputPrompt" TEXT NOT NULL,
    "inputPayload" JSONB NOT NULL,
    "status" "GenerationStatus" NOT NULL DEFAULT 'QUEUED',
    "model" TEXT NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "tokensUsed" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "generationJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generationContent" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "outputText" TEXT NOT NULL,
    "outputPayload" JSONB,
    "tone" TEXT,
    "language" TEXT DEFAULT 'en',
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "generationContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favoriteContent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "generatedContentId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favoriteContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "TemplateType" NOT NULL,
    "category" TEXT NOT NULL,
    "promptHint" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "template_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "generationJob_userId_createdAt_idx" ON "generationJob"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "generationJob_templateId_createdAt_idx" ON "generationJob"("templateId", "createdAt");

-- CreateIndex
CREATE INDEX "generationJob_status_idx" ON "generationJob"("status");

-- CreateIndex
CREATE UNIQUE INDEX "generationContent_jobId_key" ON "generationContent"("jobId");

-- CreateIndex
CREATE INDEX "favoriteContent_userId_createdAt_idx" ON "favoriteContent"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "favoriteContent_userId_generatedContentId_key" ON "favoriteContent"("userId", "generatedContentId");

-- CreateIndex
CREATE UNIQUE INDEX "template_key_key" ON "template"("key");

-- AddForeignKey
ALTER TABLE "generationJob" ADD CONSTRAINT "generationJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generationJob" ADD CONSTRAINT "generationJob_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generationContent" ADD CONSTRAINT "generationContent_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "generationJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favoriteContent" ADD CONSTRAINT "favoriteContent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favoriteContent" ADD CONSTRAINT "favoriteContent_generatedContentId_fkey" FOREIGN KEY ("generatedContentId") REFERENCES "generationContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
