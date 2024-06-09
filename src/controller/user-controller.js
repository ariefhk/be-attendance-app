import { ResponseHelper } from "../helper/response-json.js";
import { API_STATUS_CODE } from "../helper/status-code.js";

export class UserController {
  static getCurrent(req, res, next) {
    try {
      const user = req.user;
      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success get User", user));
    } catch (error) {
      next(error);
    }
  }
}
