import { db } from "../application/db.js";
import { APIError } from "../error/api-error.js";
import { API_STATUS_CODE } from "../helper/status-code.js";
import bcrypt from "bcrypt";

export class UserService {
  static async list(request) {
    const isLoggedAdmin = request?.loggedUserRole === "ADMIN";

    if (!isLoggedAdmin) {
      throw new APIError(API_STATUS_CODE.FORBIDDEN, "You dont have access to this!");
    }

    return db.user.findMany({
      orderBy: [
        {
          createdAt: "desc",
        },
      ],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  }
  static async create(request) {
    const isLoggedAdmin = request?.loggedUserRole === "ADMIN";

    if (!isLoggedAdmin) {
      throw new APIError(API_STATUS_CODE.FORBIDDEN, "You dont have access to this!");
    }

    const { email } = request;

    const countUser = await db.user.count({
      where: {
        email,
      },
    });

    if (countUser !== 0) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Email already taken!");
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

  static async update(request) {
    const isLoggedAdmin = request?.loggedUserRole === "ADMIN";

    if (!isLoggedAdmin) {
      throw new APIError(API_STATUS_CODE.FORBIDDEN, "You dont have access to this!");
    }

    const { userId } = request;

    if (!userId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "User id not inputted!");
    }

    const existedUser = await db.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!existedUser) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "User not found!");
    }

    if (request?.password) {
      request.password = await bcrypt.hash(request.password, 10);
    }

    if (request?.role && request?.role !== existedUser.role) {
      if (existedUser.role === "PARENT") {
        await db.parent.delete({
          where: {
            userId: existedUser.id,
          },
        });
      } else if (existedUser.role === "TEACHER") {
        await db.teacher.delete({
          where: {
            userId: existedUser.id,
          },
        });
      }
    }

    const user = await db.user.update({
      data: {
        name: request?.name,
        email: request?.email,
        role: request?.role,
        password: request?.password,
      },
      where: {
        id: userId,
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

  static async delete(request) {
    const isLoggedAdmin = request?.loggedUserRole === "ADMIN";

    if (!isLoggedAdmin) {
      throw new APIError(API_STATUS_CODE.FORBIDDEN, "You dont have access to this!");
    }

    const { userId } = request;

    if (!userId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "User id not inputted!");
    }

    const existedUser = await db.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!existedUser) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "User not found!");
    }

    return await db.user.delete({
      where: {
        id: userId,
      },
    });
  }
}
