import { ResponseHelper } from "../helper/response.helper.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";
import { ClassService } from "../service/class.service.js";
import { StudentClass } from "../service/studen-class.service.js";

export class ClassController {
  static async create(req, res, next) {
    try {
      const createClassRequest = {
        loggedUserRole: req?.loggedUser?.role,
        name: req?.body?.name,
        teacherId: req?.body?.teacherId ? Number(req?.body?.teacherId) : null,
      };

      const result = await ClassService.create(createClassRequest);

      return res.status(API_STATUS_CODE.CREATED).json(ResponseHelper.toJson("Success Create Class", result));
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req, res, next) {
    try {
      const getAllClassRequest = {
        loggedUserRole: req?.loggedUser?.role,
        name: req?.query?.name,
      };

      const classes = await ClassService.getAll(getAllClassRequest);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success get List Class", classes));
    } catch (error) {
      next(error);
    }
  }

  static async getAllStudentByClassId(req, res, next) {
    try {
      const getAllStudentByClassIdRequest = {
        loggedUserRole: req?.loggedUser?.role,
        name: req?.query?.name,
        classId: req?.params?.classId ? Number(req?.params?.classId) : null,
      };

      const result = await StudentClass.getAllStudentByClassId(getAllStudentByClassIdRequest);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success get List student bya class id", result));
    } catch (error) {
      next(error);
    }
  }

  static async getAllByTeacherId(req, res, next) {
    try {
      const getAllByTeacherIdRequest = {
        loggedUserRole: req?.loggedUser?.role,
        name: req?.query?.name,
        teacherId: req?.params?.teacherId ? Number(req?.params?.teacherId) : null,
      };

      const result = await ClassService.getByTeacherId(getAllByTeacherIdRequest);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success get List class by techer id", result));
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const updateClassRequest = {
        loggedUserRole: req?.loggedUser?.role,
        name: req?.body?.name,
        classId: req?.params?.classId ? Number(req?.params?.classId) : null,
        teacherId: req?.body?.teacherId ? Number(req?.body?.teacherId) : null,
      };

      const result = await ClassService.update(updateClassRequest);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success Update Class", result));
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const deletedClassRequest = {
        loggedUserRole: req?.loggedUser?.role,
        classId: req?.params?.classId ? Number(req?.params?.classId) : null,
      };

      await ClassService.delete(deletedClassRequest);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success delete Class"));
    } catch (error) {
      next(error);
    }
  }
}
