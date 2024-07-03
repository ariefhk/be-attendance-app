import { db } from "../db/connector.js";
import { APIError } from "../error/api.error.js";
import { ROLE, checkAllowedRole } from "../helper/role-check.helper.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";
import { UserService } from "./user.service.js";

export class ParentService {
  static async checkParentMustBeExistByUserId(userId) {
    if (!userId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "User id not inputted for check parent!");
    }

    const existedParent = await db.parent.findFirst({
      where: {
        userId: userId,
      },
      select: {
        id: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!existedParent) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "Parent not found!");
    }

    return {
      id: existedParent.id,
      name: existedParent?.user?.name,
      email: existedParent?.user?.email,
    };
  }

  static async checkParentMustBeExist(parentId) {
    if (!parentId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Parent id not inputted for check parent!");
    }

    const existedParent = await db.parent.findUnique({
      where: {
        id: parentId,
      },
    });

    if (!existedParent) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "Parent not found!");
    }

    return existedParent;
  }

  static async create(request) {
    const { email, name, password, role, loggedUserRole } = request;
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    const user = await UserService.create({
      email: email,
      name: name,
      password: password,
      role: role,
    });

    const parent = await db.parent.create({
      data: {
        userId: user.id,
      },
      select: {
        id: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return {
      id: parent.id,
      name: parent?.user?.name,
      email: parent?.user?.email,
    };
  }

  static async update(request) {
    const { email, parentId, name, password, role, loggedUserRole } = request;
    checkAllowedRole(ROLE.IS_ADMIN_PARENT, loggedUserRole);

    const existedParent = await this.checkParentMustBeExist(parentId);

    await UserService.update({
      loggedUserRole: loggedUserRole,
      email: email,
      name: name,
      password: password,
      role: role,
      userId: existedParent.userId,
    });

    return {
      id: existedParent.id,
      name: existedParent?.user?.name,
      email: existedParent?.user?.email,
    };
  }

  static async getAll(request) {
    const { loggedUserRole, name } = request;
    checkAllowedRole(ROLE.IS_ADMIN_TEACHER, loggedUserRole);
    const filter = {};

    if (name) {
      filter["user"] = {
        name: {
          contains: name,
          mode: "insensitive",
        },
      };
    }

    const parents = await db.parent.findMany({
      orderBy: [
        {
          createdAt: "desc",
        },
      ],
      where: filter,
      select: {
        id: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        createdAt: true,
      },
    });

    return parents.map((teacher) => {
      return {
        id: teacher.id,
        name: teacher?.user?.name,
        email: teacher?.user?.email,
        createdAt: teacher?.createdAt,
      };
    });
  }

  static async get(request) {
    const { loggedUserRole, parentId } = request;
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);
    const parent = await this.checkParentMustBeExist(parentId);

    return {
      id: parent.id,
      name: parent?.user?.name,
      email: parent?.user?.email,
    };
  }

  static async delete(request) {
    const { loggedUserRole, parentId } = request;
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    const parent = await this.checkParentMustBeExist(parentId);

    await db.parent.delete({
      where: {
        id: parent.id,
      },
    });

    await UserService.delete({
      loggedUserRole: loggedUserRole,
      userId: parent.userId,
    });

    return true;
  }
}
