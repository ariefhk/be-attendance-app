import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { UserController } from "../controller/user.controller.js";
const privateRouter = express.Router();

const userPrefix = "/api/user";

privateRouter.get(userPrefix + "/current", authMiddleware, UserController.getCurrent);
privateRouter.delete(userPrefix + "/current/logout", authMiddleware, UserController.logout);

export { privateRouter };
