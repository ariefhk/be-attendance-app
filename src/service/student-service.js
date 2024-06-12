import { db } from "../application/db.js";
import { APIError } from "../error/api-error.js";
import { ROLE, roleCheck } from "../helper/allowed-role.js";
import { API_STATUS_CODE } from "../helper/status-code.js";

export class StudentService {
  static async list(request) {
    if (!roleCheck(ROLE.IS_ADMIN_TEACHER, request?.loggedUserRole)) {
      throw new APIError(API_STATUS_CODE.FORBIDDEN, "You dont have access to this!");
    }

    const students = await db.student.findMany({
      select: {
        id: true,
        nisn: true,
        name: true,
        gender: true,
        no_telp: true,
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
        class: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
      },
    });

    const formattedStudents =
      students.length > 0
        ? students.map((st) => ({
            id: st.id,
            nisn: st.nisn,
            name: st.name,
            gender: st.gender,
            email: st.email,
            no_telp: st.no_telp,
            parent_id: st.parent?.id ?? null,
            parent: st.parent?.user?.name ?? null,
            class_id: st?.class?.id ?? null,
            class: st?.class?.name ?? null,
            createdAt: st.createdAt,
          }))
        : [];

    return formattedStudents;
  }

  static async create(request) {
    if (!roleCheck(ROLE.IS_ADMIN_TEACHER, request?.loggedUserRole)) {
      throw new APIError(API_STATUS_CODE.FORBIDDEN, "You dont have access to this!");
    }

    const student = await db.student.create({
      data: {
        nisn: request?.nisn,
        no_telp: request?.no_telp,
        name: request?.name,
        email: request?.email,
        gender: request?.gender,
        classId: request.classId ?? null,
        parentId: request.parentId ?? null,
      },
      select: {
        id: true,
        name: true,
        nisn: true,
        no_telp: true,
        email: true,
        class: {
          select: {
            id: true,
            name: true,
          },
        },
        parent: {
          select: {
            id: true,
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

    const formattedStudent = {
      id: student.id,
      nisn: student.nisn,
      name: student.name,
      no_telp: student.no_telp,
      email: student.email,
      class_id: student?.class?.id ?? null,
      class: student?.class?.name ?? null,
      parent_id: student?.parent?.id ?? null,
      parent: student?.parent?.user?.name ?? null,
    };

    return formattedStudent;
  }

  static async update(request) {
    if (!roleCheck(ROLE.IS_ADMIN_TEACHER, request?.loggedUserRole)) {
      throw new APIError(API_STATUS_CODE.FORBIDDEN, "You dont have access to this!");
    }

    const { studentId } = request;

    let existedParent = null;

    if (request?.parentId !== null) {
      existedParent = await db.parent.findUnique({
        where: { id: request?.parentId },
      });

      if (!existedParent) {
        throw new APIError(API_STATUS_CODE.NOT_FOUND, "Parrent Not found!");
      }
    }

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

    let studentData = {
      nisn: request?.nisn,
      no_telp: request?.no_telp,
      name: request?.name,
      email: request?.email,
      gender: request?.gender,
    };

    if (request?.classId) {
      studentData = {
        ...studentData,
        classId: request.classId,
      };
    }

    if (existedParent?.id) {
      studentData = {
        ...studentData,
        parentId: existedParent?.id,
      };
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
        gender: true,
        email: true,
        class: {
          select: {
            id: true,
            name: true,
          },
        },
        parent: {
          select: {
            id: true,
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

    const formattedStudent = {
      id: student.id,
      nisn: student.nisn,
      name: student.name,
      no_telp: student.no_telp,
      gender: student.gender,
      email: student.email,
      class_id: student?.class?.id ?? null,
      class: student?.class?.name ?? null,
      parent_id: student?.parent?.id ?? null,
      parent: student?.parent?.user?.name ?? null,
    };

    return formattedStudent;
  }

  static async delete(request) {
    if (!roleCheck(ROLE.IS_ADMIN_TEACHER, request?.loggedUserRole)) {
      throw new APIError(API_STATUS_CODE.FORBIDDEN, "You dont have access to this!");
    }

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
