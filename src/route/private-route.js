import express from "express";
import { UserController } from "../controller/user-controller.js";
import { authMiddleware } from "../middleware/auth-middleware.js";
import { ParentController } from "../controller/parent-controller.js";
import { StudentController } from "../controller/student-controller.js";
import { ClassController } from "../controller/class-controller.js";
import { TeacherController } from "../controller/teacher-controller.js";
import { AttendanceController } from "../controller/attendance-controller.js";

const privateRouter = express.Router();
const userApiPrefix = "/api/user";
const parentApiPrefix = "/api/parent";
const studentApiPrefix = "/api/student";
const classApiPrefix = "/api/class";
const teacherApiPrefix = "/api/teacher";
const attendanceApiPrefix = "/api/attendance";

// USER
privateRouter.get(userApiPrefix + "/current", authMiddleware, UserController.getCurrent);
privateRouter.get(userApiPrefix, authMiddleware, UserController.getListUser);
privateRouter.post(userApiPrefix, authMiddleware, UserController.create);
privateRouter.delete(userApiPrefix + "/:userId", authMiddleware, UserController.delete);
privateRouter.put(userApiPrefix + "/:userId", authMiddleware, UserController.update);

// PARENT
privateRouter.get(parentApiPrefix, authMiddleware, ParentController.list);

// STUDENT
privateRouter.get(studentApiPrefix, authMiddleware, StudentController.list);
privateRouter.post(studentApiPrefix, authMiddleware, StudentController.create);
privateRouter.put(studentApiPrefix + "/:studentId", authMiddleware, StudentController.update);
privateRouter.delete(studentApiPrefix + "/:studentId", authMiddleware, StudentController.delete);

// CLASS
privateRouter.get(classApiPrefix, authMiddleware, ClassController.list);
privateRouter.get(classApiPrefix + "/:classId", authMiddleware, ClassController.detailClass);
privateRouter.post(classApiPrefix, authMiddleware, ClassController.create);
privateRouter.put(classApiPrefix + "/:classId", authMiddleware, ClassController.update);
privateRouter.delete(classApiPrefix + "/:classId", authMiddleware, ClassController.delete);

// TEACHER
privateRouter.get(teacherApiPrefix, authMiddleware, TeacherController.list);

// ATTENDANCE
privateRouter.get(attendanceApiPrefix + "/daily", authMiddleware, AttendanceController.dailyList);
privateRouter.get(attendanceApiPrefix + "/weekly", authMiddleware, AttendanceController.weeklyList);
privateRouter.get(attendanceApiPrefix + "/student/weekly", authMiddleware, AttendanceController.studentWeeklyList);
privateRouter.get(attendanceApiPrefix + "/student/monthly", authMiddleware, AttendanceController.studentMonthlyList);
privateRouter.post(attendanceApiPrefix, authMiddleware, AttendanceController.createOrUpdate);
privateRouter.post(
  attendanceApiPrefix + "/present/daily",
  authMiddleware,
  AttendanceController.createOrUpdateStudentToAllPresent
);
privateRouter.post(attendanceApiPrefix + "/absent/daily", authMiddleware, AttendanceController.createOrUpdateStudentToAllAbsent);
privateRouter.post(
  attendanceApiPrefix + "/holiday/daily",
  authMiddleware,
  AttendanceController.createOrUpdateStudentToAllHoliday
);
privateRouter.post(attendanceApiPrefix + "/late/daily", authMiddleware, AttendanceController.createOrUpdateStudentToAllLate);

export { privateRouter };
