import { StudentService } from "../service/student.service.js";
import { ResponseHelper } from "../helper/response.helper.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";
import { StudentClass } from "../service/studen-class.service.js";

export class StudentController {
  static async create(req, res, next) {
    try {
      const createStudentRequest = {
        loggedUserRole: req?.loggedUser?.role,
        name: req?.body?.name,
        nisn: req?.body?.nisn,
        no_telp: req?.body?.no_telp,
        gender: req?.body?.gender,
        email: req?.body?.email,
        parentId: req?.body?.parentId ? Number(req?.body?.parentId) : null,
      };

      const result = await StudentService.create(createStudentRequest);

      return res.status(API_STATUS_CODE.CREATED).json(ResponseHelper.toJson("Success create student", result));
    } catch (error) {
      next(error);
    }
  }

  static async registerUserWithClass(req, res, next) {
    try {
      const registerUserWithClassRequest = {
        loggedUserRole: req?.loggedUser?.role,
        studentId: req?.params?.studentId ? Number(req?.params?.studentId) : null,
        classId: req?.body?.classId ? Number(req?.body?.classId) : null,
      };

      const result = await StudentClass.registerUserWithClass(registerUserWithClassRequest);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success register student with class", result));
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const updateStudentRequest = {
        loggedUserRole: req?.loggedUser?.role,
        name: req?.body?.name,
        nisn: req?.body?.nisn,
        no_telp: req?.body?.no_telp,
        gender: req?.body?.gender,
        email: req?.body?.email,
        studentId: req?.params?.studentId ? Number(req?.params?.studentId) : null,
        parentId: req?.body?.parentId ? Number(req?.body?.parentId) : null,
      };

      const result = await StudentService.update(updateStudentRequest);

      return res.status(API_STATUS_CODE.CREATED).json(ResponseHelper.toJson("Success update student", result));
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req, res, next) {
    try {
      const getAllStudentRequest = {
        loggedUserRole: req?.loggedUser?.role,
        name: req?.query?.name,
      };

      const result = await StudentService.getAll(getAllStudentRequest);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success get List Student", result));
    } catch (error) {
      next(error);
    }
  }

  static async deleteStudentFromClass(req, res, next) {
    try {
      const deleteStudentFromClassRequest = {
        loggedUserRole: req?.loggedUser?.role,
        studentId: req?.params?.studentId ? Number(req?.params?.studentId) : null,
        classId: req?.params?.classId ? Number(req?.params?.classId) : null,
      };

      await StudentClass.delete(deleteStudentFromClassRequest);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success delete Student from class"));
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const deleteStudentRequest = {
        loggedUserRole: req?.loggedUser?.role,
        studentId: req?.params?.studentId ? Number(req?.params?.studentId) : null,
      };

      await StudentService.delete(deleteStudentRequest);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success delete Student"));
    } catch (error) {
      next(error);
    }
  }
}
