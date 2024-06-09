import { ResponseHelper } from "../helper/response-json.js";
import { API_STATUS_CODE } from "../helper/status-code.js";

export class HelloController {
  static sayHello(req, res, next) {
    try {
      res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Hello from API!"));
    } catch (error) {
      next(error);
    }
  }
}
