import { ResponseHelper } from "../helper/response-json.js";
import { API_STATUS_CODE } from "../helper/status-code.js";
import { ParentService } from "../service/parent-service.js";

export class ParentController {
  static async list(req, res, next) {
    try {
      const loggedUserRole = req.loggedUser.role;

      const requestData = {
        loggedUserRole,
      };

      const parents = await ParentService.list(requestData);

      return res.status(API_STATUS_CODE.CREATED).json(ResponseHelper.toJson("Success Get Parents", parents));
    } catch (error) {
      next(error);
    }
  }
}
