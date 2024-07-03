import { db } from "../db/connector.js";
import { APIError } from "../error/api.error.js";
import { ROLE, checkAllowedRole } from "../helper/role-check.helper.js";
import { makeJwt, decodeJwt } from "../helper/jwt.helper.js";
import { createBcryptPassword, compareBcryptPassword } from "../helper/hashing.helper.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";
import { ParentService } from "./parent.service.js";
import { TeacherService } from "./teacher.service.js";

export class UserService {
  static toUserResponse(user) {
    return {
      id: user?.id,
      name: user?.name,
      email: user?.email,
      role: user?.role,
    };
  }

  static async checkUserMustBeExistByField(field, value) {
    if (!value) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, `${field} not inputted!`);
    }

    const query = {};
    query[field] = value;

    const existedUser = await db.user.findUnique({
      where: query,
    });

    if (!existedUser) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "User not found!");
    }

    return existedUser;
  }

  static async checkUserMustBeExistById(userId) {
    return this.checkUserMustBeExistByField("id", userId);
  }

  static async checkUserMustBeExistByEmail(email) {
    return this.checkUserMustBeExistByField("email", email);
  }

  static async getAll(request) {
    const { name, loggedUserRole } = request;
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);
    const filter = {};

    if (name) {
      filter["name"] = {
        contains: name,
        mode: "insensitive",
      };
    }

    const users = await db.user.findMany({
      where: filter,
      orderBy: [
        {
          createdAt: "desc",
        },
      ],
    });

    return users.map((user) => this.toUserResponse(user));
  }

  static async update(request) {
    const { userId, loggedUserRole, name, role, email, password } = request;

    checkAllowedRole(ROLE.IS_ADMIN_TEACHER, loggedUserRole);

    if (!userId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "User id not inputted!");
    }

    const user = await this.checkUserMustBeExistById(userId);

    const updatedUserData = {
      name: name ?? user.name,
      role: role ?? user.role,
      email: email ?? user.email,
      password: password ? await createBcryptPassword(password) : user.password,
    };

    const updatedUser = await db.user.update({
      where: {
        id: user.id,
      },
      data: updatedUserData,
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
    };
  }

  static async register(request) {
    const { email, name, password, role } = request;

    if (!email || !password || !role || !name) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Email, password, role or name not inputted!");
    }

    const existedUser = await db.user.findFirst({
      where: {
        email: email,
      },
    });

    if (existedUser) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Email already existed!");
    }

    const hashedPassword = await createBcryptPassword(password);

    const createdUserData = {
      name: name,
      email: email,
      password: hashedPassword,
      role: role,
    };

    const user = await db.user.create({
      data: createdUserData,
    });

    if (user.role === "PARENT") {
      await ParentService.create({
        userId: user.id,
        name: user.name,
      });
    } else if (user.role === "TEACHER") {
      await TeacherService.create({
        userId: user.id,
        name: user.name,
        nip: request?.nip ?? null,
      });
      createdUserData["nip"] = request?.nip ?? null;
    }

    delete createdUserData["password"];

    return {
      id: user.id,
      ...createdUserData,
    };
  }

  static async create(request) {
    console.log("request", request);
    const { email, name, password, role } = request;

    if (!email || !password || !role || !name) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Email, password, role or name not inputted!");
    }

    const existedUser = await db.user.findFirst({
      where: {
        email: email,
      },
    });

    if (existedUser) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Email already existed!");
    }

    const hashedPassword = await createBcryptPassword(password);

    const createdUserData = {
      name: name,
      email: email,
      password: hashedPassword,
      role: role,
    };

    const user = await db.user.create({
      data: createdUserData,
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  }

  static async login(request) {
    const { email, password } = request;

    if (!email || !password) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Email or password not inputted!");
    }
    const existedUser = await this.checkUserMustBeExistByEmail(email);

    const checkPassword = await compareBcryptPassword(password, existedUser.password);

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
    });

    return {
      ...this.toUserResponse(existedUser),
      token,
    };
  }

  static async logout(request) {
    const { userId } = request;

    if (!userId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "User id not inputted!");
    }

    const user = await this.checkUserMustBeExistById(userId);

    await db.user.update({
      where: {
        id: user.id,
      },
      data: {
        token: null,
      },
    });

    return true;
  }

  static async delete(request) {
    const { userId, loggedUserRole } = request;

    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    if (!userId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "User id not inputted!");
    }

    const user = await this.checkUserMustBeExistById(userId);

    await db.user.delete({
      where: {
        id: user.id,
      },
    });

    return true;
  }

  static async checkUserToken(token) {
    const existedToken = await db.user.findFirst({
      where: {
        token: token,
      },
    });

    if (!existedToken) {
      throw new APIError(API_STATUS_CODE.UNAUTHORIZED, "Unauthorized!");
    }

    const decodedUser = await decodeJwt(token);
    const existedUser = await this.checkUserMustBeExistById(decodedUser.id);
    let user;
    let nip;

    if (existedUser.role === "PARENT") {
      user = await ParentService.checkParentMustBeExistByUserId(existedUser.id);
    } else if (existedUser.role === "TEACHER") {
      user = await TeacherService.checkTeacherMustBeExistByUserId(existedUser.id);
      nip = user.nip;
    }

    const result = {
      id: existedUser.id, // we get id of user for easy delete
      username: existedUser.username,
      role: existedUser.role,
      name: existedUser.name,
      email: existedUser.email,
    };

    if (existedUser.role === "TEACHER") {
      result["nip"] = nip;
    }

    return result;
  }
}
