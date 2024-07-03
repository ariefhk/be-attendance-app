import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { UserController } from "../controller/user.controller.js";
import { TeacherController } from "../controller/teacher.controller.js";
import { ParentController } from "../controller/parent.controller.js";

const privateRouter = express.Router();

const userPrefix = "/api/users";
const teacherPrefix = "/api/teachers";
const parentPrefix = "/api/parents";

// USER ROUTES
privateRouter.get(userPrefix + "/current", authMiddleware, UserController.getCurrent);
privateRouter.get(userPrefix, authMiddleware, UserController.getAll);
privateRouter.put(userPrefix, authMiddleware, UserController.update);
privateRouter.put(userPrefix + "/current/:userId", authMiddleware, UserController.updateCurrent);
privateRouter.delete(userPrefix + "/current/logout", authMiddleware, UserController.logout);

// TEACHER ROUTES
privateRouter.get(teacherPrefix, authMiddleware, TeacherController.getAll);
privateRouter.post(teacherPrefix, authMiddleware, TeacherController.create);
privateRouter.put(teacherPrefix + "/:teacherId", authMiddleware, TeacherController.update);
privateRouter.delete(teacherPrefix + "/:teacherId", authMiddleware, TeacherController.delete);

// PARENT ROUTES
privateRouter.get(parentPrefix, authMiddleware, ParentController.getAll);
privateRouter.post(parentPrefix, authMiddleware, ParentController.create);
privateRouter.put(parentPrefix + "/:parentId", authMiddleware, ParentController.update);
privateRouter.delete(parentPrefix + "/:parentId", authMiddleware, ParentController.delete);

export { privateRouter };
