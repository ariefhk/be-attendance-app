import { db } from "../db/connector.js";
import { APIError } from "../error/api.error.js";
import { ROLE, checkAllowedRole } from "../helper/role-check.helper.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";
import { ParentService } from "./parent.service.js";
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

  static async getAllStudentClassByStudentName(request) {
    const { studentName, loggedUserRole } = request;
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);
    const filter = {};

    if (studentName) {
      filter["student"] = {
        name: {
          contains: studentName,
          mode: "insensitive",
        },
      };
    }

    const studentClasses = await db.studentClass.findMany({
      orderBy: [
        {
          createdAt: "desc",
        },
      ],
      where: filter,
      select: {
        id: true,
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
        },
      },
    });
  }

  static async create(request) {
    const { studentId, classId, loggedUserRole } = request;
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    const existedStudent = await StudentService.checkStudentMustBeExist(studentId);
    const existedClass = await ClassService.checkClassMustBeExist(classId);

    const createdStudentClass = await db.studentClass.create({
      data: {
        studentId: existedStudent.id,
        classId: existedClass.id,
      },
      select: {
        id: true,
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            nisn: true,
            no_telp: true,
          },
        },
      },
    });
  }
}
