import { db } from "../db/db-connetor.js";
import { APIError } from "../error/api-error.js";
import { API_STATUS_CODE } from "../helper/status-code.js";
import { ROLE, checkAllowedRole } from "../helper/allowed-role.js";
import { compareBcryptPassword, createBcryptPassword } from "../helper/hashing.js";
import { makeJwt } from "../helper/jwt.js";

export class UserService {
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

    request.password = await createBcryptPassword(request.password, 10);

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

    const checkPassword = await compareBcryptPassword(request?.password, existedUser.password);

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

  static async list(request) {
    // check role
    checkAllowedRole(ROLE.IS_ADMIN, request?.loggedUserRole);

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
    // check role
    checkAllowedRole(ROLE.IS_ADMIN, request?.loggedUserRole);

    const { email } = request;

    const countUser = await db.user.count({
      where: {
        email,
      },
    });

    if (countUser !== 0) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Email already taken!");
    }

    request.password = await createBcryptPassword(request.password, 10);

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
    // check role
    checkAllowedRole(ROLE.IS_ADMIN, request?.loggedUserRole);

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
      request.password = await createBcryptPassword(request.password, 10);
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
    // check role
    checkAllowedRole(ROLE.IS_ADMIN, request?.loggedUserRole);

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
