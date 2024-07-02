import { db } from "../db/connector.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";

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
      user: {
        select: {
          name: true,
          email: true,
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

  static async create(request) {
    const { userId } = request;

    if (!userId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "User id not inputted for create parent!");
    }

    const parent = await db.parent.create({
      data: {
        userId: userId,
      },
      select: {
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
}
