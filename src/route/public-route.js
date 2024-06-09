import express from "express";
import { HelloController } from "../controller/hello-controller.js";
import { AuthController } from "../controller/auth-controller.js";

const publicRouter = express.Router();

const prefix = "/api/auth";

publicRouter.get("/", HelloController.sayHello);
publicRouter.post(prefix + "/register", AuthController.register);
publicRouter.post(prefix + "/login", AuthController.login);

export { publicRouter };
