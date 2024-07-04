import { db } from "../db/connector.js";
import { APIError } from "../error/api.error.js";
import { ROLE, checkAllowedRole } from "../helper/role-check.helper.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";
import { ParentService } from "./parent.service.js";

export class StudentService {
  static async checkStudentMustBeExist(studentId) {
    if (!studentId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Student id not inputted for check student!");
    }

    const existedStudent = await db.student.findUnique({
      where: {
        id: studentId,
      },
    });

    if (!existedStudent) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "Student not found!");
    }

    return existedStudent;
  }

  static async getAll(request) {
    const { name, loggedUserRole } = request;
    const filter = {};
    checkAllowedRole(ROLE.IS_ADMIN_TEACHER, loggedUserRole);

    if (name) {
      filter["name"] = {
        contains: name,
        mode: "insensitive",
      };
    }

    const students = await db.student.findMany({
      orderBy: [
        {
          createdAt: "desc",
        },
      ],
      where: filter,
      select: {
        id: true,
        name: true,
        email: true,
        nisn: true,
        no_telp: true,
        gender: true,
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
        parent: {
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

    return students.map((s) => {
      return {
        id: s.id,
        name: s?.name,
        email: s?.email,
        nisn: s?.nisn,
        no_telp: s?.no_telp,
        gender: s?.gender,
        classCount: `${s?.studentClass?.length}`,
        parent: {
          id: s?.parent?.id,
          name: s?.parent?.user?.name,
          email: s?.parent?.user?.email,
        },
      };
    });
  }

  static async create(request) {
    const { name, nisn, email, no_telp, gender, parentId, loggedUserRole } = request;
    checkAllowedRole(ROLE.IS_ADMIN_TEACHER, loggedUserRole);

    const existedParent = await ParentService.checkParentMustBeExist(parentId);

    const createdStudent = await db.student.create({
      data: {
        name: name,
        nisn: nisn,
        no_telp: no_telp,
        gender: gender,
        email: email,
        parentId: existedParent.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        nisn: true,
        no_telp: true,
        gender: true,
        parent: {
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
      id: createdStudent?.id,
      name: createdStudent?.name,
      email: createdStudent?.email,
      nisn: createdStudent?.nisn,
      no_telp: createdStudent?.no_telp,
      gender: createdStudent.gender,
      parent: {
        id: createdStudent?.parent?.id,
        name: createdStudent?.parent?.user?.name,
        email: createdStudent?.parent?.user?.email,
      },
    };
  }

  static async update(request) {
    const { studentId, name, nisn, email, no_telp, gender, parentId, loggedUserRole } = request;
    checkAllowedRole(ROLE.IS_ADMIN_TEACHER, loggedUserRole);

    const existedStudent = await StudentService.checkStudentMustBeExist(studentId);

    if (parentId) {
      await ParentService.checkParentMustBeExist(parentId);
    }

    const updatedStudent = await db.student.update({
      where: {
        id: studentId,
      },
      data: {
        name: name ?? existedStudent.name,
        email: email ?? existedStudent.email,
        nisn: nisn ?? existedStudent.nisn,
        no_telp: no_telp ?? existedStudent.no_telp,
        gender: gender ?? existedStudent.gender,
        parentId: parentId ?? existedStudent.parentId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        nisn: true,
        no_telp: true,
        gender: true,
        parent: {
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
      id: updatedStudent?.id,
      name: updatedStudent?.name,
      email: updatedStudent?.email,
      nisn: updatedStudent?.nisn,
      no_telp: updatedStudent?.no_telp,
      gender: updatedStudent.gender,
      parent: {
        id: updatedStudent?.parent?.id,
        name: updatedStudent?.parent?.user?.name,
        email: updatedStudent?.parent?.user?.email,
      },
    };
  }

  static async delete(request) {
    const { studentId, loggedUserRole } = request;
    checkAllowedRole(ROLE.IS_ADMIN_TEACHER, loggedUserRole);

    const existedStudent = await StudentService.checkStudentMustBeExist(studentId);

    await db.student.delete({
      where: {
        id: existedStudent.id,
      },
    });

    return true;
  }
}
