import { db } from "../db/connector.js";
import { APIError } from "../error/api.error.js";
import { ROLE, checkAllowedRole } from "../helper/role-check.helper.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";

export class TeacherService {
  static async checkTeacherMustBeExistByUserId(userId) {
    if (!userId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "User id not inputted for check teacher!");
    }

    const existedTeacher = await db.teacher.findFirst({
      where: {
        userId: userId,
      },
    });

    if (!existedTeacher) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "Teacher not found!");
    }

    return existedTeacher;
  }

  static async checkTeacherMustBeExist(teacherId) {
    if (!teacherId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Teacher id not inputted for check teacher!");
    }

    const existedTeacher = await db.teacher.findUnique({
      where: {
        id: teacherId,
      },
    });

    if (!existedTeacher) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "Teacher not found!");
    }

    return existedTeacher;
  }

  static async create(request) {
    const { userId, nip } = request;

    if (!userId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "User id not inputted for create teacher!");
    }

    const teacher = await db.teacher.create({
      data: {
        userId: userId,
        nip: request?.nip,
      },
      select: {
        nip: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return {
      id: teacher.id,
      nip: teacher?.nip,
      name: teacher?.user?.name,
      email: teacher?.user?.email,
    };
  }
  static async login(request) {}
  static async checkUser(request) {}
}
