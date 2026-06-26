// src/app/module/generations/generations.routes.ts
import { Router } from "express";
import { GenerationController } from "./generation.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { UserRole } from "../../../generated/prisma/enums";
import { validateRequest } from "../../middleware/validateRequest";
import {
    createGenerationSchema,
    updateGenerationSchema,
} from "./generation.validation";

const router = Router();

router.post(
    "/",
    checkAuth(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER),
    validateRequest(createGenerationSchema),
    GenerationController.create
);

router.get(
    "/",
    checkAuth(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER),
    GenerationController.getAll
);

router.get(
    "/:id",
    checkAuth(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER),
    GenerationController.getById
);

router.patch(
    "/:id",
    checkAuth(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER),
    validateRequest(updateGenerationSchema),
    GenerationController.update
);

router.delete(
    "/:id",
    checkAuth(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER),
    GenerationController.delete
);

router.post(
    "/:id/regenerate",
    checkAuth(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER),
    GenerationController.regenerate
);

export const GenerationRouter = router;