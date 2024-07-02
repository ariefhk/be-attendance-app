import { db } from "../db/connector.js";
import { APIError } from "../error/api.error.js";
import { ROLE, checkAllowedRole } from "../helper/role-check.helper.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";

export class TeacherService {
  static toTeacherResponse(teacher) {
    return {
      id: teacher.id,
      nip: teacher.nip,
      name: teacher.user.name,
      email: teacher.user.email,
      classes:
        teacher.class.length > 0
          ? teacher.class.map((cl) => ({
              id: cl.id,
              name: cl.name,
            }))
          : [],
      createdAt: teacher.createdAt,
    };
  }

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

    const teachers = await db.teacher.findMany({
      orderBy: [
        {
          createdAt: "desc",
        },
      ],
      where: filter,
    });

    return teachers.map((teacher) => this.toTeacherResponse(teacher));
  }

  static async get(request) {
    const { loggedUserRole, teacherId } = request;
    checkAllowedRole(ROLE.IS_ADMIN_TEACHER, loggedUserRole);
    const teacher = await this.checkTeacherMustBeExist(teacherId);

    return this.toTeacherResponse(teacher);
  }

  static async update(user) {
    const { userId, nip } = user;

    if (!userId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "User id not inputted for update teacher!");
    }

    const teacher = await this.checkTeacherMustBeExistByUserId(userId);

    const updatedTeacher = await db.teacher.update({
      where: {
        id: teacher.id,
      },
      data: {
        nip: nip ?? teacher.nip,
      },
    });

    return updatedTeacher;
  }

  static async create(request) {
    const { userId, nip } = request;

    if (!userId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "User id not inputted for create teacher!");
    }

    const teacher = await db.teacher.create({
      data: {
        userId: userId,
        nip: nip ?? null,
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
}
