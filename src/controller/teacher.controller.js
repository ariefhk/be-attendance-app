import { ResponseHelper } from "../helper/response.helper.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";
import { TeacherService } from "../service/teacher.service.js";

export class TeacherController {
  static async create(req, res, next) {
    try {
      const createTeacherRequest = {
        loggedUserRole: req?.loggedUser?.role,
        name: req?.body?.name,
        email: req?.body?.email,
        password: req?.body?.password,
        nip: req?.body?.nip ?? null,
        role: "TEACHER",
      };

      const result = await TeacherService.create(createTeacherRequest);

      return res.status(API_STATUS_CODE.CREATED).json(ResponseHelper.toJson("Success get create Teacher", result));
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const updateTeacherRequest = {
        loggedUserRole: req?.loggedUser?.role,
        teacherId: req?.params?.teacherId ? Number(req?.params?.teacherId) : null,
        name: req?.body?.name,
        email: req?.body?.email,
        password: req?.body?.password,
        nip: req?.body?.nip ?? null,
        role: "TEACHER",
      };

      const result = await TeacherService.update(updateTeacherRequest);

      return res.status(API_STATUS_CODE.CREATED).json(ResponseHelper.toJson("Success get create Teacher", result));
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req, res, next) {
    try {
      const getAllTeacherRequest = {
        loggedUserRole: req?.loggedUser?.role,
        name: req?.query?.name,
      };

      const result = await TeacherService.getAll(getAllTeacherRequest);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success get List Teacher", result));
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const deleteTeacherRequest = {
        loggedUserRole: req?.loggedUser?.role,
        teacherId: req?.params?.teacherId ? Number(req?.params?.teacherId) : null,
      };

      await TeacherService.delete(deleteTeacherRequest);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success delete Teacher"));
    } catch (error) {
      next(error);
    }
  }
}
