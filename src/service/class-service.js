import { db } from "../db/db-connetor.js";
import { APIError } from "../error/api-error.js";
import { ROLE, checkAllowedRole } from "../helper/allowed-role.js";
import { API_STATUS_CODE } from "../helper/status-code.js";

export class ClassService {
  static async list(request) {
    checkAllowedRole(ROLE.IS_ADMIN_TEACHER, request?.loggedUserRole);
    let filter = {};
    let teacherFilter = {};
    let combinedFilter = {};
    let classes;

    if (request?.name) {
      filter.name = {
        contains: request?.name,
        mode: "insensitive",
      };
    }

    if (request?.loggedUserRole === "TEACHER") {
      const existedTeacher = await db.teacher.findFirst({
        where: {
          userId: request?.loggedUserId,
        },
      });

      if (!existedTeacher) {
        throw new APIError(API_STATUS_CODE.NOT_FOUND, "Teacher not found!");
      }

      teacherFilter.teacherId = existedTeacher.id;
      combinedFilter = { AND: [filter, teacherFilter] };
    }

    classes = await db.class.findMany({
      where: request?.loggedUserRole === "ADMIN" ? filter : combinedFilter,
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
        studentClass: {
          orderBy: {
            student: {
              name: "asc",
            },
          },
          select: {
            student: true,
          },
        },
        createdAt: true,
      },
    });

    // Transform the data to the desired format
    const formattedClasses =
      classes.length > 0
        ? classes.map((cls) => ({
            id: cls.id,
            name: cls.name,
            total_student: cls.studentClass.length,
            teacher: {
              id: cls?.teacher?.id ?? null,
              name: cls.teacher?.user?.name ?? null,
            },
            student:
              cls.studentClass.length > 0
                ? cls.studentClass.map((stdCls) => {
                    return {
                      id: stdCls?.student?.id ?? null,
                      name: stdCls?.student?.name ?? null,
                      nisn: stdCls?.student?.nisn ?? null,
                    };
                  })
                : [],
            createdAt: cls.createdAt,
          }))
        : [];

    return formattedClasses;
  }

  static async detailClass(request) {
    checkAllowedRole(ROLE.IS_ADMIN_TEACHER, request?.loggedUserRole);

    const { classId } = request;

    if (!classId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "You not inputted class id");
    }

    const existedClass = await db.class.findUnique({
      where: {
        id: classId,
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
        studentClass: {
          orderBy: {
            student: {
              name: "asc",
            },
          },
          select: {
            student: {
              select: {
                id: true,
                name: true,
                nisn: true,
                email: true,
                gender: true,
              },
            },
          },
        },
      },
    });

    if (!existedClass) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "Class not found!");
    }

    const formattedClass = {
      id: existedClass.id,
      name: existedClass.name,
      teacher: {
        id: existedClass?.teacher?.id ?? null,
        nip: existedClass?.teacher?.nip ?? null,
        name: existedClass?.teacher?.user?.name ?? null,
      },
      students:
        existedClass?.studentClass?.length > 0
          ? existedClass.studentClass.map((stdCls) => {
              return {
                id: stdCls.student.id ?? null,
                name: stdCls.student.name ?? null,
                nisn: stdCls.student.nisn ?? null,
                email: stdCls.student.email ?? null,
                gender: stdCls.student.gender ?? null,
              };
            })
          : [],
    };

    return formattedClass;
  }

  static async create(request) {
    checkAllowedRole(ROLE.IS_ADMIN, request?.loggedUserRole);
    const { teacherId } = request;

    if (!request?.name) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "class name must be submitted!");
    }

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
      const existedClass = await db.class.findFirst({
        where: {
          name: request?.name,
          teacherId: teacherId,
        },
      });

      if (existedClass) {
        throw new APIError(API_STATUS_CODE.BAD_REQUEST, "class is existed!");
      }

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
      teacher: {
        id: createdClass?.teacher?.id ?? null,
        nip: createdClass?.teacher?.nip ?? null,
        name: createdClass?.teacher?.user?.name ?? null,
      },
    };

    return formattedClass;
  }

  static async update(request) {
    checkAllowedRole(ROLE.IS_ADMIN, request?.loggedUserRole);

    const { classId } = request;

    if (!classId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "You not inputted class id");
    }

    const exitedClass = await db.class.findUnique({
      where: {
        id: classId,
      },
    });

    if (!exitedClass) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "class not found!");
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
      teacher: {
        id: classes.teacher?.id ?? null,
        name: classes.teacher?.user?.name ?? null,
      },
      createdAt: classes.createdAt,
    };

    return formattedClasses;
  }

  static async delete(request) {
    checkAllowedRole(ROLE.IS_ADMIN, request?.loggedUserRole);

    const { classId } = request;

    return await db.class.delete({
      where: {
        id: classId,
      },
    });
  }
}
