import { db } from "../application/db.js";
import { APIError } from "../error/api-error.js";
import { ROLE, roleCheck } from "../helper/allowed-role.js";
import { makeJwt } from "../helper/jwt.js";
import { API_STATUS_CODE } from "../helper/status-code.js";
import bcrypt from "bcrypt";

export class ClassService {
  static async list(request) {
    if (!roleCheck(ROLE.IS_ADMIN_TEACHER, request?.loggedUserRole)) {
      throw new APIError(API_STATUS_CODE.FORBIDDEN, "You dont have access to this!");
    }

    let classes;

    if (request?.loggedUserRole === "ADMIN") {
      classes = await db.class.findMany({
        select: {
          id: true,
          name: true,
          teacher: {
            select: {
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          createdAt: true,
        },
      });
    } else if (request?.loggedUserRole === "TEACHER") {
      classes = await db.class.findMany({
        where: {
          teacherId: request?.loggedUserId,
        },
        select: {
          id: true,
          name: true,
          teacher: {
            select: {
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          createdAt: true,
        },
      });
    }
    // Transform the data to the desired format
    const formattedClasses =
      classes.length > 0
        ? classes.map((cls) => ({
            id: cls.id,
            name: cls.name,
            teacher_id: cls.teacher?.user?.id || "No teacher assigned",
            teacher_name: cls.teacher?.user?.name || "No teacher assigned",
            createdAt: cls.createdAt,
          }))
        : [];

    return formattedClasses;
  }

  static async create(request) {
    if (!roleCheck(ROLE.IS_ADMIN, request?.loggedUserRole)) {
      throw new APIError(API_STATUS_CODE.FORBIDDEN, "You dont have access to this!");
    }

    const { teacherId } = request;

    let createdClass;

    if (!teacherId) {
      createdClass = await db.class.create({
        data: {
          name: request?.name,
        },
        select: {
          id: true,
          name: true,
          teacher: {
            select: {
              nip: true,
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });
    } else {
      createdClass = await db.class.create({
        data: {
          name: request?.name,
          teacherId,
        },
        select: {
          id: true,
          name: true,
          teacher: {
            select: {
              nip: true,
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });
    }

    const formattedClass = {
      id: createdClass.id,
      name: createdClass.name,
      teacher_id: createdClass.teacher?.id || "No teacher assigned",
      teacher_nip: createdClass.teacher?.nip || "No NIP teacher assigned",
      teacher_name: createdClass.teacher?.user?.name || "No teacher assigned",
    };

    return formattedClass;
  }

  static async delete(request) {
    if (!roleCheck(ROLE.IS_ADMIN, request?.loggedUserRole)) {
      throw new APIError(API_STATUS_CODE.FORBIDDEN, "You dont have access to this!");
    }

    const { classId } = request;

    return await db.class.delete({
      where: {
        id: classId,
      },
    });
  }
}
