import { db } from "../application/db.js";
import { APIError } from "../error/api-error.js";
import { ROLE, roleCheck } from "../helper/allowed-role.js";
import { API_STATUS_CODE } from "../helper/status-code.js";

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
              id: true,
              nip: true,
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
              id: true,
              nip: true,
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
            teacher_id: cls?.teacher?.id ?? null,
            teacher_name: cls.teacher?.user?.name ?? null,
            createdAt: cls.createdAt,
          }))
        : [];

    console.log("FORMATEDL CASS: ", formattedClasses);

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
              id: true,
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
              id: true,
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
      teacher_id: createdClass?.teacher?.id ?? null,
      teacher_nip: createdClass?.teacher?.nip ?? null,
      teacher_name: createdClass?.teacher?.user?.name ?? null,
    };

    return formattedClass;
  }

  static async update(request) {
    if (!roleCheck(ROLE.IS_ADMIN, request?.loggedUserRole)) {
      throw new APIError(API_STATUS_CODE.FORBIDDEN, "You dont have access to this!");
    }

    const { classId } = request;

    if (!classId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "You not inputted class id");
    }

    let classes = await db.class.update({
      where: {
        id: classId,
      },
      data: {
        name: request?.name,
        teacherId: request?.teacherId ?? null,
      },
      select: {
        id: true,
        name: true,
        teacher: {
          select: {
            id: true,
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

    // Transform the data to the desired format
    const formattedClasses = {
      id: classes.id,
      name: classes.name,
      teacher_id: classes.teacher?.id ?? null,
      teacher_name: classes.teacher?.user?.name ?? null,
      createdAt: classes.createdAt,
    };

    return formattedClasses;
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
