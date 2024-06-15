import { db } from "../db/db-connetor.js";
import { API_STATUS_CODE } from "../helper/status-code.js";
import { ResponseHelper } from "../helper/response-json.js";
import { decodeJwt } from "../helper/jwt.js";
import { APIError } from "../error/api-error.js";

export const authMiddleware = async (req, res, next) => {
  const token = req.get("Authorization")?.split("Bearer ")[1];
  if (!token) {
    return res.status(API_STATUS_CODE.UNAUTHORIZED).json(ResponseHelper.toJsonError("Unauthorized!")).end();
  } else {
    try {
      const decodedUser = await decodeJwt(token);

      const user = await db.user.findFirst({
        where: {
          id: decodedUser?.id,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });

      if (!user) {
        return res.status(API_STATUS_CODE.UNAUTHORIZED).json(ResponseHelper.toJsonError("Unauthorized!")).end();
      }

      req.loggedUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      };
      next();
    } catch (error) {
      if (error instanceof APIError) {
        return res.status(API_STATUS_CODE.UNAUTHORIZED).json(ResponseHelper.toJsonError("Unauthorized!")).end();
      }

      return res.status(API_STATUS_CODE.SERVER_ERROR).json(ResponseHelper.toJsonError("Server Error While Check Token!")).end();
    }
  }
};
