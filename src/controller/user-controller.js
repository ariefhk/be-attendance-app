import { ResponseHelper } from "../helper/response-json.js";
import { API_STATUS_CODE } from "../helper/status-code.js";
import { UserService } from "../service/user-service.js";

export class UserController {
  static getCurrent(req, res, next) {
    try {
      const loggedUser = req.loggedUser;
      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success get User", loggedUser));
    } catch (error) {
      next(error);
    }
  }
  static async getListUser(req, res, next) {
    try {
      const loggedUserRole = req.loggedUser.role;

      const requestData = {
        loggedUserRole,
      };

      const users = await UserService.list(requestData);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success get List User", users));
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const loggedUserRole = req.loggedUser.role;

      const requestData = {
        loggedUserRole,
        nip: req?.body?.nip, //optional if user add role teacher
        name: req?.body?.name,
        role: req?.body?.role,
        email: req?.body?.email,
        password: req?.body?.password,
      };

      const user = await UserService.create(requestData);

      return res.status(API_STATUS_CODE.CREATED).json(ResponseHelper.toJson("Success create User", user));
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const loggedUserRole = req.loggedUser.role;

      const requestData = {
        loggedUserRole,
        userId: Number(req?.params?.userId),
        nip: req?.body?.nip, //optional if user add role teacher
        name: req?.body?.name,
        role: req?.body?.role,
        email: req?.body?.email,
        password: req?.body?.password,
      };

      const user = await UserService.update(requestData);

      return res.status(API_STATUS_CODE.CREATED).json(ResponseHelper.toJson("Success update User", user));
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const loggedUserRole = req.loggedUser.role;

      const requestData = {
        loggedUserRole,
        userId: Number(req?.params?.userId),
      };

      await UserService.delete(requestData);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success Delete User"));
    } catch (error) {
      next(error);
    }
  }
}
