import { ResponseHelper } from "../helper/response-json.js";
import { API_STATUS_CODE } from "../helper/status-code.js";
import { StudentService } from "../service/student-service.js";

export class StudentController {
  static async list(req, res, next) {
    try {
      const loggedUserRole = req.loggedUser.role;

      const requestData = {
        loggedUserRole,
      };

      const students = await StudentService.list(requestData);

      return res.status(API_STATUS_CODE.CREATED).json(ResponseHelper.toJson("Success Get Students", students));
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const loggedUserRole = req.loggedUser.role;

      const requestData = {
        loggedUserRole,
        nisn: req?.body?.nisn,
        no_telp: req?.body?.no_telp,
        name: req?.body?.name,
        email: req?.body?.email,
        gender: req?.body?.gender,
        classId: req?.body?.classId ?? null,
        parentId: req?.body?.parentId ?? null,
      };

      const user = await StudentService.create(requestData);

      return res.status(API_STATUS_CODE.CREATED).json(ResponseHelper.toJson("Success create Student", user));
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const loggedUserRole = req.loggedUser.role;

      const requestData = {
        loggedUserRole,
        studentId: Number(req?.params?.studentId),
        nisn: req?.body?.nisn,
        no_telp: req?.body?.no_telp,
        name: req?.body?.name,
        email: req?.body?.email,
        gender: req?.body?.gender,
        classId: req?.body?.classId ?? null,
        parentId: req?.body?.parentId ?? null,
      };

      const student = await StudentService.update(requestData);

      return res.status(API_STATUS_CODE.CREATED).json(ResponseHelper.toJson("Success update Student", student));
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const loggedUserRole = req.loggedUser.role;

      const requestData = {
        loggedUserRole,
        studentId: Number(req?.params?.studentId),
      };

      await StudentService.delete(requestData);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success Delete Student"));
    } catch (error) {
      next(error);
    }
  }
}
