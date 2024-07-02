import { ResponseHelper } from "../helper/response.helper.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";
import { UserService } from "../service/user.service.js";

export class UserController {
  static async register(req, res, next) {
    try {
      const registerUserRequest = {
        name: req?.body?.name,
        email: req?.body?.email,
        password: req?.body?.password,
        role: req?.body?.role,
        nip: req?.body?.nip,
      };

      const result = await UserService.register(registerUserRequest);

      return res.status(API_STATUS_CODE.CREATED).json(ResponseHelper.toJson("Success Create User", result));
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const loginUserRequest = {
        email: req?.body?.email,
        password: req?.body?.password,
      };
      const result = await UserService.login(loginUserRequest);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success Login User", result));
    } catch (error) {
      next(error);
    }
  }
  static getCurrent(req, res, next) {
    try {
      const user = req.loggedUser;

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success get current User", user));
    } catch (error) {
      next(error);
    }
  }

  static async getListUser(req, res, next) {
    try {
      const getListUserRequest = {
        role: req?.loggedUser?.role,
        name: req?.query?.name,
      };

      const users = await UserService.getAll(getListUserRequest);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success get List User", users));
    } catch (error) {
      next(error);
    }
  }

  // static async update(req, res, next) {
  //   try {
  //     const loggedUserRole = req.loggedUser.role;

  //     const requestData = {
  //       loggedUserRole,
  //       userId: Number(req?.params?.userId),
  //       nip: req?.body?.nip, //optional if user add role teacher
  //       name: req?.body?.name,
  //       role: req?.body?.role,
  //       email: req?.body?.email,
  //       password: req?.body?.password,
  //     };

  //     const user = await UserService.update(requestData);

  //     return res.status(API_STATUS_CODE.CREATED).json(ResponseHelper.toJson("Success update User", user));
  //   } catch (error) {
  //     next(error);
  //   }
  // }

  static async logout(req, res, next) {
    try {
      const logoutUserRequest = {
        userId: req.loggedUser.id ? Number(req.loggedUser.id) : null,
      };

      await UserService.logout(logoutUserRequest);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success Logout User"));
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const deleteUserRequest = {
        role: req.loggedUser.role,
        userId: req?.params?.userId ? Number(req?.params?.userId) : null,
      };

      await UserService.delete(deleteUserRequest);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success Delete User"));
    } catch (error) {
      next(error);
    }
  }
}
