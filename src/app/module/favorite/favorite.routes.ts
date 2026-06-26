import { Router } from "express";
import { FavoriteController } from "./favorite.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { UserRole } from "../../../generated/prisma/enums";

const router = Router();

const allRoles = checkAuth(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER);

router.post("/", allRoles, FavoriteController.add);
router.get("/", allRoles, FavoriteController.getAll);
router.delete("/:id", allRoles, FavoriteController.remove);

export const FavoriteRouter = router;