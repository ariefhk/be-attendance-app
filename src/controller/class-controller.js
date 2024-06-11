import { ResponseHelper } from "../helper/response-json.js";
import { API_STATUS_CODE } from "../helper/status-code.js";
import { ClassService } from "../service/class-service.js";

export class ClassController {
  static async list(req, res, next) {
    try {
      const loggedUserRole = req.loggedUser.role;

      const requestData = {
        loggedUserRole,
      };

      const classes = await ClassService.list(requestData);

      return res.status(API_STATUS_CODE.CREATED).json(ResponseHelper.toJson("Success Get Classes", classes));
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const loggedUserRole = req.loggedUser.role;

      const requestData = {
        loggedUserRole,
        name: req?.body?.name,
        teacherId: req?.body?.teacherId ? Number(req?.body?.teacherId) : null,
      };

      const createdClass = await ClassService.create(requestData);

      return res.status(API_STATUS_CODE.CREATED).json(ResponseHelper.toJson("Success create Class", createdClass));
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const loggedUserRole = req.loggedUser.role;

      const requestData = {
        loggedUserRole,
        name: req?.body?.name,
        classId: req?.params?.classId ? Number(req?.params?.classId) : null,
        teacherId: req?.body?.teacherId ? Number(req?.body?.teacherId) : null,
      };

      const classes = await ClassService.update(requestData);

      return res.status(API_STATUS_CODE.CREATED).json(ResponseHelper.toJson("Success update Class", classes));
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const loggedUserRole = req.loggedUser.role;

      const requestData = {
        loggedUserRole,
        classId: req?.params?.classId ? Number(req?.params?.classId) : null,
      };

      await ClassService.delete(requestData);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success Delete class"));
    } catch (error) {
      next(error);
    }
  }
}
