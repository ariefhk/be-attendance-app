import { ResponseHelper } from "../helper/response-json.js";
import { API_STATUS_CODE } from "../helper/status-code.js";
import { AuthService } from "../service/auth-service.js";

export class AuthController {
  static async register(req, res, next) {
    try {
      const registerUser = await AuthService.register(req?.body);
      return res.status(API_STATUS_CODE.CREATED).json(ResponseHelper.toJson("Success Create User", registerUser));
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const loginUser = await AuthService.login(req?.body);
      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success Login User", loginUser));
    } catch (error) {
      next(error);
    }
  }
}
