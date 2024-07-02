import express from "express";
import { HelloController } from "../controller/hello.controller.js";
import { UserController } from "../controller/user.controller.js";

const publicRouter = express.Router();
const authPrefix = "/api/auth";

publicRouter.get("/", HelloController.sayHello);
publicRouter.post(authPrefix + "/login", UserController.login);
publicRouter.post(authPrefix + "/register", UserController.register);

export { publicRouter };
