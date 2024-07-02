import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { UserController } from "../controller/user.controller.js";
const privateRouter = express.Router();

const userPrefix = "/api/users";

privateRouter.get(userPrefix + "/current", authMiddleware, UserController.getCurrent);
privateRouter.get(userPrefix, authMiddleware, UserController.getAll);
privateRouter.put(userPrefix, authMiddleware, UserController.update);
privateRouter.put(userPrefix + "/current/:userId", authMiddleware, UserController.updateCurrent);
privateRouter.delete(userPrefix + "/current/logout", authMiddleware, UserController.logout);

export { privateRouter };
