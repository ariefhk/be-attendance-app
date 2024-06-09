import express from "express";
import { UserController } from "../controller/user-controller.js";
import { authMiddleware } from "../middleware/auth-middleware.js";

const privateRouter = express.Router();
const prefix = "/api/user";

privateRouter.get(prefix + "/current", authMiddleware, UserController.getCurrent);

export { privateRouter };
