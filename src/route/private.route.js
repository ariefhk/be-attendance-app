import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { UserController } from "../controller/user.controller.js";
import { TeacherController } from "../controller/teacher.controller.js";
import { ParentController } from "../controller/parent.controller.js";
import { ClassController } from "../controller/class.controller.js";
import { StudentController } from "../controller/student.controller.js";

const privateRouter = express.Router();

// CUSTOM ROUTES
const userPrefix = "/api/users";
const teacherPrefix = "/api/teachers";
const parentPrefix = "/api/parents";
const classPrefix = "/api/classes";
const studentPrefix = "/api/students";

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

// CLASS ROUTES
privateRouter.get(classPrefix, authMiddleware, ClassController.getAll);
privateRouter.post(classPrefix, authMiddleware, ClassController.create);
privateRouter.put(classPrefix + "/:classId", authMiddleware, ClassController.update);
privateRouter.delete(classPrefix + "/:classId", authMiddleware, ClassController.delete);

// STUDENT ROUTES
privateRouter.get(studentPrefix, authMiddleware, StudentController.getAll);
privateRouter.post(studentPrefix, authMiddleware, StudentController.create);
privateRouter.put(studentPrefix + "/:studentId", authMiddleware, StudentController.update);
privateRouter.delete(studentPrefix + "/:studentId", authMiddleware, StudentController.delete);

export { privateRouter };
