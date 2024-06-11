import { ResponseHelper } from "../helper/response-json.js";
import { API_STATUS_CODE } from "../helper/status-code.js";
import { TeacherService } from "../service/teacher-service.js";

export class TeacherController {
  static async list(req, res, next) {
    try {
      const loggedUserRole = req.loggedUser.role;

      const requestData = {
        loggedUserRole,
      };

      const teachers = await TeacherService.list(requestData);

      return res.status(API_STATUS_CODE.CREATED).json(ResponseHelper.toJson("Success Get Teachers", teachers));
    } catch (error) {
      next(error);
    }
  }
}
