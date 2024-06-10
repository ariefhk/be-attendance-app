import { db } from "../application/db.js";
import { APIError } from "../error/api-error.js";
import { makeJwt } from "../helper/jwt.js";
import { API_STATUS_CODE } from "../helper/status-code.js";
import bcrypt from "bcrypt";

export class AuthService {
  static async register(request) {
    const { email } = request;

    // check user
    const countUser = await db.user.count({
      where: {
        email,
      },
    });

    // check email already used
    if (countUser !== 0) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Email already taken!");
    }

    // chec role
    if (!request?.role) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Empty given Role!");
    }

    request.password = await bcrypt.hash(request.password, 10);

    const user = await db.user.create({
      data: {
        name: request?.name,
        email,
        password: request?.password,
        role: request?.role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (user?.role === "PARENT") {
      await db.parent.create({
        data: {
          userId: user.id,
        },
      });
    } else if (user?.role === "TEACHER") {
      await db.teacher.create({
        data: {
          userId: user.id,
          nip: request?.nip ? request?.nip : null,
        },
      });
    }

    return user;
  }

  static async login(request) {
    const { email } = request;

    const existedUser = await db.user.findUnique({
      where: {
        email,
      },
    });

    if (!existedUser) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "User not found!");
    }

    const checkPassword = await bcrypt.compare(request?.password, existedUser.password);

    if (!checkPassword) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Email or password wrong!");
    }

    const token = await makeJwt(
      {
        id: existedUser.id,
      },
      "30d"
    );

    await db.user.update({
      where: {
        email,
      },
      data: {
        token,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return {
      token,
    };
  }
}
