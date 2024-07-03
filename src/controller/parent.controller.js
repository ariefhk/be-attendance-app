import { ResponseHelper } from "../helper/response.helper.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";
import { ParentService } from "../service/parent.service.js";

export class ParentController {
  static async create(req, res, next) {
    try {
      const createParentRequest = {
        loggedUserRole: req?.loggedUser?.role,
        name: req?.body?.name,
        email: req?.body?.email,
        password: req?.body?.password,
        role: "PARENT",
      };

      const result = await ParentService.create(createParentRequest);

      return res.status(API_STATUS_CODE.CREATED).json(ResponseHelper.toJson("Success create parent", result));
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const updateParentRequest = {
        loggedUserRole: req?.loggedUser?.role,
        parentId: req?.params?.parentId ? Number(req?.params?.parentId) : null,
        name: req?.body?.name,
        email: req?.body?.email,
        password: req?.body?.password,
        role: "PARENT",
      };

      const result = await ParentService.update(updateParentRequest);

      return res.status(API_STATUS_CODE.CREATED).json(ResponseHelper.toJson("Success update Parent", result));
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req, res, next) {
    try {
      const getAllParentRequest = {
        loggedUserRole: req?.loggedUser?.role,
        name: req?.query?.name,
      };

      const result = await ParentService.getAll(getAllParentRequest);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success get List Parent", result));
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const deleteParentRequest = {
        loggedUserRole: req?.loggedUser?.role,
        parentId: req?.params?.parentId ? Number(req?.params?.parentId) : null,
      };

      await ParentService.delete(deleteParentRequest);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success delete Parent"));
    } catch (error) {
      next(error);
    }
  }
}
