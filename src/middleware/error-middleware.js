import { APIError } from "../error/api-error.js";
import { logger } from "../application/logging.js";
import { ResponseHelper } from "../helper/response-json.js";
import { API_STATUS_CODE } from "../helper/status-code.js";

export const errorMiddleware = async (error, req, res, next) => {
  if (error instanceof APIError) {
    logger.error(`Error status ${error.status}, ${error.message}`);
    return res.status(error.status).json(ResponseHelper.toJsonError(error.message));
  } else if (error instanceof Error) {
    logger.error(`Error status 500, ${error.message}`);
    return res.status(API_STATUS_CODE.SERVER_ERROR).json(ResponseHelper.toJsonError(error.message));
  }
};
