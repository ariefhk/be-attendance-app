import { db } from "../db/db-connetor.js";
import { APIError } from "../error/api-error.js";
import { ROLE } from "../helper/allowed-role.js";
import { API_STATUS_CODE } from "../helper/status-code.js";
import { checkAllowedRole } from "../helper/allowed-role.js";

export class StudentService {
  static async list(request) {
    checkAllowedRole(ROLE.IS_ALL_ROLE, request?.loggedUserRole);
    let filter = {};
    let existedStudent;

    if (request?.parentId) {
      filter.parentId = request?.parentId;
    }

    if (request?.name) {
      filter.name = {
        contains: request?.name,
        mode: "insensitive",
      };
    }

    existedStudent = await db.student.findMany({
      orderBy: [
        {
          createdAt: "desc",
        },
      ],
      where: filter,
      select: {
        id: true,
        nisn: true,
        name: true,
        gender: true,
        no_telp: true,
        studentClass: {
          select: {
            class: {
              select: {
                id: true,
                name: true,
                teacher: {
                  select: {
                    id: true,
                    user: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        parent: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        createdAt: true,
      },
    });

    const formattedStudents =
      existedStudent.length > 0
        ? existedStudent.map((st) => ({
            id: st.id,
            nisn: st?.nisn ?? null,
            name: st?.name ?? null,
            gender: st?.gender ?? null,
            email: st?.email ?? null,
            no_telp: st?.no_telp ?? null,
            parent: {
              id: st?.parent?.id ?? null,
              name: st?.parent?.user?.name ?? null,
            },
            classes:
              st?.studentClass?.length > 0
                ? st?.studentClass?.map((st_cls) => {
                    return {
                      class: {
                        id: st_cls?.class?.id ?? null,
                        name: st_cls?.class?.name ?? null,
                        teacher: {
                          id: st_cls?.class?.teacher?.id ?? null,
                          name: st_cls?.class?.teacher?.user?.name ?? null,
                        },
                      },
                    };
                  })
                : [],
            createdAt: st.createdAt,
          }))
        : [];

    return formattedStudents;
  }

  static async create(request) {
    checkAllowedRole(ROLE.IS_ADMIN_TEACHER, request?.loggedUserRole);

    if (!request?.nisn) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Nisn must be inputted!");
    }

    const studentCount = await db.student.count({
      where: {
        nisn: request.nisn,
      },
    });

    if (studentCount !== 0) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Student already exist!");
    }

    const student = await db.student.create({
      data: {
        nisn: request?.nisn,
        no_telp: request?.no_telp,
        name: request?.name,
        email: request?.email,
        gender: request?.gender,
        parentId: request.parentId ?? null,
      },
      select: {
        id: true,
        name: true,
        nisn: true,
        no_telp: true,
        email: true,
        parent: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        studentClass: {
          select: {
            class: {
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

    let formattedStudent = {
      id: student.id,
      nisn: student.nisn,
      name: student.name,
      no_telp: student.no_telp,
      email: student.email,
      parent: {
        id: student?.parent?.id ?? null,
        name: student?.parent?.user?.name ?? null,
      },
      class: {
        id: null,
        name: null,
        teacher: {
          id: null,
          name: null,
        },
      },
    };

    if (request?.classId) {
      const existedClass = await db.class.findUnique({
        where: {
          id: request?.classId,
        },
      });

      if (!existedClass) {
        throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Class not found!");
      }

      const studentClass = await db.studentClass.create({
        data: {
          classId: existedClass.id,
          studentId: student.id,
        },
        select: {
          class: {
            select: {
              id: true,
              name: true,
              teacher: {
                select: {
                  id: true,
                  user: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      formattedStudent = {
        ...formattedStudent,
        class: {
          id: studentClass?.class?.id ?? null,
          name: studentClass?.class?.name ?? null,
          teacher: {
            id: studentClass?.class?.teacher?.id ?? null,
            name: studentClass?.class.teacher?.user?.name ?? null,
          },
        },
      };
    }

    return formattedStudent;
  }

  static async update(request) {
    checkAllowedRole(ROLE.IS_ADMIN_TEACHER, request?.loggedUserRole);

    const { studentId } = request;

    if (!studentId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Student id not inputted!");
    }

    let existedParent = null;

    let studentData = {
      nisn: request?.nisn,
      no_telp: request?.no_telp,
      name: request?.name,
      email: request?.email,
      gender: request?.gender,
    };

    if (request?.parentId) {
      existedParent = await db.parent.findUnique({
        where: { id: request?.parentId },
      });

      if (!existedParent) {
        throw new APIError(API_STATUS_CODE.NOT_FOUND, "Parrent Not found!");
      }
      if (existedParent?.id) {
        studentData = {
          ...studentData,
          parentId: existedParent?.id,
        };
      }
    }

    const existedStudent = await db.student.findUnique({
      where: {
        id: studentId,
      },
    });

    if (!existedStudent) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "Student not found!");
    }

    // if insert new class
    if (request?.newClassId && !request?.oldClassId) {
      const existedClass = await db.class.findUnique({
        where: {
          id: request?.newClassId,
        },
      });

      if (!existedClass) {
        throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Class not found!");
      }

      const existedStudentClass = await db.studentClass.findUnique({
        where: {
          studentId_classId: {
            studentId: studentId,
            classId: request?.newClassId,
          },
        },
      });

      if (existedStudentClass) {
        throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Student already on class!");
      }

      await db.studentClass.create({
        data: {
          classId: request?.newClassId,
          studentId: studentId,
        },
      });
    }

    // if updated old class and new class
    if (request?.newClassId && request?.oldClassId) {
      const classIds = [request?.newClassId, request?.oldClassId];
      const classes = await db.class.findMany({
        where: {
          id: {
            in: classIds,
          },
        },
      });

      if (classes.length !== classIds.length) {
        throw new APIError(API_STATUS_CODE.BAD_REQUEST, "There is not found classes while updating studen class!");
      }

      // Check if the studentClass entry exists
      const existedStudentClass = await db.studentClass.findUnique({
        where: {
          studentId_classId: {
            studentId: studentId,
            classId: request?.oldClassId,
          },
        },
      });

      if (!existedStudentClass) {
        throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Student Class not found or student not there!");
      }

      await db.studentClass.update({
        where: {
          studentId_classId: {
            studentId: studentId,
            classId: request?.oldClassId,
          },
        },
        data: {
          classId: request?.newClassId,
        },
      });
    }

    const student = await db.student.update({
      data: studentData,
      where: {
        id: existedStudent.id,
      },
      select: {
        id: true,
        name: true,
        nisn: true,
        no_telp: true,
        email: true,
        parent: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        studentClass: {
          select: {
            class: {
              select: {
                id: true,
                name: true,
                teacher: {
                  select: {
                    id: true,
                    user: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        createdAt: true,
      },
    });

    //for returnning student
    const formattedStudent = {
      id: student.id,
      nisn: student.nisn,
      name: student.name,
      no_telp: student.no_telp,
      email: student.email,
      parent: {
        id: student?.parent?.id ?? null,
        name: student?.parent?.user?.name ?? null,
      },
      classes:
        student?.studentClass?.length > 0
          ? student?.studentClass?.map((st_cls) => {
              return {
                class: {
                  id: st_cls?.class?.id ?? null,
                  name: st_cls?.class?.name ?? null,
                  teacher: {
                    id: st_cls?.class?.teacher?.id ?? null,
                    name: st_cls?.class?.teacher?.user?.name ?? null,
                  },
                },
              };
            })
          : [],
    };

    return formattedStudent;
  }

  static async delete(request) {
    checkAllowedRole(ROLE.IS_ADMIN_TEACHER, request?.loggedUserRole);

    const { studentId } = request;

    if (!studentId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Student id not inputted!");
    }

    const existedStudent = await db.student.findUnique({
      where: {
        id: studentId,
      },
    });

    if (!existedStudent) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "Student not found!");
    }

    return await db.student.delete({
      where: {
        id: existedStudent.id,
      },
    });
  }
}
