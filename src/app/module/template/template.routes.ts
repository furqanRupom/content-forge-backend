// src/app/module/templates/templates.routes.ts
import { Router } from "express";
import { TemplateController } from "./template.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { UserRole } from "../../../generated/prisma/enums";
import { validateRequest } from "../../middleware/validateRequest";
import { createTemplateSchema, updateTemplateSchema } from "./template.validation";

const router = Router();

router.get("/", TemplateController.getAll);
router.get("/:id", TemplateController.getById);
router.post("/",validateRequest(createTemplateSchema), checkAuth(UserRole.ADMIN, UserRole.MANAGER), TemplateController.create);
router.patch("/:id", validateRequest(updateTemplateSchema), checkAuth(UserRole.ADMIN, UserRole.MANAGER), TemplateController.update);
router.delete("/:id", checkAuth(UserRole.ADMIN, UserRole.MANAGER), TemplateController.delete);

export const TemplateRouter = router;