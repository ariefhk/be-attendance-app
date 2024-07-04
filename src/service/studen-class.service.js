import { db } from "../db/connector.js";
import { APIError } from "../error/api.error.js";
import { ROLE, checkAllowedRole } from "../helper/role-check.helper.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";
import { StudentService } from "./student.service.js";
import { ClassService } from "./class.service.js";

export class StudentClass {
  static async checkStudentClassMustBeExist(studentClassId) {
    if (!studentClassId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Student class id not inputted for check student class!");
    }

    const existedStudentClass = await db.studentClass.findUnique({
      where: {
        id: studentClassId,
      },
    });

    if (!existedStudentClass) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "Student class not found!");
    }

    return existedStudentClass;
  }

  static async getAllStudentByClassId(request) {
    const { name, loggedUserRole, classId } = request;
    checkAllowedRole(ROLE.IS_ADMIN_TEACHER, loggedUserRole);

    const existedClass = await ClassService.checkClassMustBeExist(classId);

    const filter = {};

    if (name) {
      filter["student"] = {
        name: {
          contains: name,
          mode: "insensitive",
        },
      };
    }

    const studentClasses = await db.studentClass.findMany({
      where: {
        classId: existedClass.id,
      },
      select: {
        student: {
          select: {
            id: true,
            name: true,
            gender: true,
            email: true,
            nisn: true,
            no_telp: true,
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
        },
      },
    });

    const formattedStudentClasses =
      studentClasses.length > 0
        ? studentClasses.map((sc) => {
            return {
              student: {
                id: sc?.student?.id,
                name: sc?.student?.name,
                gender: sc?.student?.gender,
                nisn: sc?.student?.nisn,
              },
              parent: {
                id: sc?.student?.parent?.id,
                name: sc?.student?.parent?.user?.name,
              },
            };
          })
        : [];

    return {
      class: {
        id: existedClass.id,
        name: existedClass.name,
      },
      teacher: {
        id: existedClass.teacher.id,
        name: existedClass.teacher.user.name,
      },
      students: formattedStudentClasses,
    };
  }

  static async registerUserWithClass(request) {
    const { studentId, classId, loggedUserRole } = request;
    checkAllowedRole(ROLE.IS_ADMIN_TEACHER, loggedUserRole);

    const existedStudent = await StudentService.checkStudentMustBeExist(studentId);
    const existedClass = await ClassService.checkClassMustBeExist(classId);

    const createdStudentClass = await db.studentClass.create({
      data: {
        studentId: existedStudent.id,
        classId: existedClass.id,
      },
      select: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            nisn: true,
            no_telp: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      student: {
        id: createdStudentClass?.student?.id,
        name: createdStudentClass?.student?.name,
        email: createdStudentClass?.student?.email,
        nisn: createdStudentClass?.student?.nisn,
        no_telp: createdStudentClass?.student?.no_telp,
      },
      class: {
        id: createdStudentClass?.class?.id,
        name: createdStudentClass?.class?.name,
      },
    };
  }

  static async delete(request) {
    const { studentId, classId, loggedUserRole } = request;
    checkAllowedRole(ROLE.IS_ADMIN_TEACHER, loggedUserRole);

    const existedStudent = await StudentService.checkStudentMustBeExist(studentId);
    const existedClass = await ClassService.checkClassMustBeExist(classId);

    await db.studentClass.delete({
      where: {
        studentId_classId: {
          studentId: existedStudent.id,
          classId: existedClass.id,
        },
      },
    });

    return true;
  }
}
