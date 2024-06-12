import { ResponseHelper } from "../helper/response-json.js";
import { API_STATUS_CODE } from "../helper/status-code.js";
import { AttendanceService } from "../service/attendance-service.js";

export class AttendanceController {
  static async studentWeeklyList(req, res, next) {
    try {
      const loggedUserRole = req.loggedUser.role;

      const requestData = {
        loggedUserRole,
        classId: req.body.classId ? Number(req.body.classId) : null,
        year: req.body.year,
        month: req.body.month,
        week: req.body.week ? req.body.week : 1,
        studentId: req.body.studentId ? Number(req.body.studentId) : null,
      };

      const attendances = await AttendanceService.studentWeeklyList(requestData);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success Get Student Weekly Attendances", attendances));
    } catch (error) {
      next(error);
    }
  }
  static async dailyList(req, res, next) {
    try {
      const loggedUserRole = req.loggedUser.role;

      const requestData = {
        loggedUserRole,
        classId: req.body.classId ? Number(req.body.classId) : null,
        date: req.body.date,
      };

      const attendances = await AttendanceService.dailyList(requestData);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success Get Daily Attendances", attendances));
    } catch (error) {
      next(error);
    }
  }

  static async weeklyList(req, res, next) {
    try {
      const loggedUserRole = req.loggedUser.role;

      const requestData = {
        loggedUserRole,
        classId: req.body.classId ? Number(req.body.classId) : null,
        year: req.body.year,
        month: req.body.month,
        week: req.body.week ? req.body.week : 1,
      };

      const attendances = await AttendanceService.weeklyList(requestData);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success Get Weekly Attendances", attendances));
    } catch (error) {
      next(error);
    }
  }

  static async list(req, res, next) {
    try {
      const loggedUserRole = req.loggedUser.role;

      const requestData = {
        loggedUserRole,
        classId: req.body.classId ? Number(req.body.classId) : null,
        date: req.body.date,
      };

      const attendances = await AttendanceService.list(requestData);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success Get Attendances", attendances));
    } catch (error) {
      next(error);
    }
  }

  static async createOrUpdate(req, res, next) {
    try {
      const loggedUserRole = req.loggedUser.role;

      const requestData = {
        loggedUserRole,
        date: req.body.date,
        teacherId: req?.body?.teacherId ? Number(req?.body?.teacherId) : null,
        studentId: req?.body?.studentId ? Number(req?.body?.studentId) : null,
        classId: req?.body?.classId ? Number(req?.body?.classId) : null,
        status: req?.body?.status ? req?.body?.status : null,
      };

      const createdAttendance = await AttendanceService.createOrUpdate(requestData);

      return res.status(API_STATUS_CODE.CREATED).json(ResponseHelper.toJson("Success create Attendance", createdAttendance));
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
    } catch (error) {
      next(error);
    }
  }
}
