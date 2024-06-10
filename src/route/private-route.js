import express from "express";
import { UserController } from "../controller/user-controller.js";
import { authMiddleware } from "../middleware/auth-middleware.js";

const privateRouter = express.Router();
const userApiPrefix = "/api/user";

privateRouter.get(userApiPrefix + "/current", authMiddleware, UserController.getCurrent);
privateRouter.get(userApiPrefix, authMiddleware, UserController.getListUser);
privateRouter.post(userApiPrefix, authMiddleware, UserController.create);
privateRouter.delete(userApiPrefix + "/:userId", authMiddleware, UserController.delete);
privateRouter.put(userApiPrefix + "/:userId", authMiddleware, UserController.update);

export { privateRouter };
