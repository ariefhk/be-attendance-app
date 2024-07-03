import { db } from "../db/connector.js";
import { APIError } from "../error/api.error.js";
import { ROLE, checkAllowedRole } from "../helper/role-check.helper.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";
import { UserService } from "./user.service.js";

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

  static async create(request) {
    const { email, name, password, role, nip, loggedUserRole } = request;
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    const user = await UserService.create({
      email: email,
      name: name,
      password: password,
      role: role,
    });

    const teacher = await db.teacher.create({
      data: {
        userId: user.id,
        nip: nip,
      },
      select: {
        id: true,
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

  static async update(request) {
    const { email, teacherId, name, password, role, nip, loggedUserRole } = request;
    checkAllowedRole(ROLE.IS_ADMIN_TEACHER, loggedUserRole);

    const existedTeacher = await this.checkTeacherMustBeExist(teacherId);

    await UserService.update({
      loggedUserRole: loggedUserRole,
      email: email,
      name: name,
      password: password,
      role: role,
      userId: existedTeacher.userId,
    });

    const teacher = await db.teacher.update({
      where: {
        id: existedTeacher.id,
      },
      data: {
        nip: nip,
      },
      select: {
        id: true,
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
      select: {
        id: true,
        nip: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
      },
    });

    return teachers.map((teacher) => this.toTeacherResponse(teacher));
  }

  static async get(request) {
    const { loggedUserRole, teacherId } = request;
    checkAllowedRole(ROLE.IS_ADMIN_TEACHER, loggedUserRole);
    const teacher = await this.checkTeacherMustBeExist(teacherId);

    return this.toTeacherResponse(teacher);
  }

  static async delete(request) {
    const { loggedUserRole, teacherId } = request;
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    const teacher = await this.checkTeacherMustBeExist(teacherId);

    await db.teacher.delete({
      where: {
        id: teacher.id,
      },
    });

    await UserService.delete({
      loggedUserRole: loggedUserRole,
      userId: teacher.userId,
    });

    return true;
  }
}
