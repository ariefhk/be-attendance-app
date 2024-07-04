import { db } from "../db/connector.js";
import { APIError } from "../error/api.error.js";
import { ROLE, checkAllowedRole } from "../helper/role-check.helper.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";
import { TeacherService } from "./teacher.service.js";

export class ClassService {
  static async checkClassMustBeExist(classId) {
    if (!classId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Class id not inputted for check class!");
    }

    const existedClass = await db.class.findUnique({
      where: {
        id: classId,
      },
    });

    if (!existedClass) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "Class not found!");
    }

    return existedClass;
  }

  static async create(request) {
    const { name, teacherId, loggedUserRole } = request;
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    const existedTeacher = await TeacherService.checkTeacherMustBeExist(teacherId);

    const createdClass = await db.class.create({
      data: {
        name: name,
        teacherId: existedTeacher.id,
      },
      select: {
        id: true,
        name: true,
        teacher: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return {
      id: createdClass?.id,
      name: createdClass?.name,
      teacher: {
        id: createdClass?.teacher?.id,
        name: createdClass?.teacher?.user?.name,
        email: createdClass?.teacher?.user?.email,
      },
    };
  }

  static async update(request) {
    const { classId, teacherId, name, loggedUserRole } = request;
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    const existedClass = await ClassService.checkClassMustBeExist(classId);

    if (teacherId) {
      await TeacherService.checkTeacherMustBeExist(teacherId);
    }

    const updatedClass = await db.class.update({
      where: {
        id: existedClass.id,
      },
      data: {
        name: name ?? existedClass.name,
        teacherId: teacherId ?? existedClass.teacherId,
      },
      select: {
        id: true,
        name: true,
        teacher: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return {
      id: updatedClass?.id,
      name: updatedClass?.name,
      teacher: {
        id: updatedClass?.teacher?.id,
        name: updatedClass?.teacher?.user?.name,
        email: updatedClass?.teacher?.user?.email,
      },
    };
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

    const classes = await db.class.findMany({
      orderBy: [
        {
          createdAt: "desc",
        },
      ],
      where: filter,
      select: {
        id: true,
        name: true,
        teacher: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        studentClass: {
          select: {
            student: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return classes.map((cls) => {
      return {
        id: cls.id,
        name: cls.name,
        teacher: {
          id: cls?.teacher?.id,
          name: cls?.teacher?.user?.name,
          email: cls?.teacher?.user?.email,
        },
        studentCount: `${cls?.studentClass?.length}`,
      };
    });
  }

  static async delete(request) {
    const { classId, loggedUserRole } = request;
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    const existedClass = await ClassService.checkClassMustBeExist(classId);

    await db.class.delete({
      where: {
        id: existedClass.id,
      },
    });

    return true;
  }
}
