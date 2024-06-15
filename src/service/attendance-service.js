import { db } from "../db/db-connetor.js";
import { APIError } from "../error/api-error.js";
import { ROLE, checkAllowedRole } from "../helper/allowed-role.js";
import { API_STATUS_CODE } from "../helper/status-code.js";
import { transformDate, getWeekMonToSaturdayDates } from "../helper/date.js";

export class AttendanceService {
  static async createOrUpdateBulkAttendance(classId, date, status) {
    if (!classId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Class Id not inputted!");
    }

    if (!date) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "date not inputted!");
    }
    if (!status) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "status not inputted!");
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
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!existedClass) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "Class not found!");
    }

    const studentClass = await db.studentClass.findMany({
      where: {
        classId: existedClass.id,
      },
      select: {
        student: true,
      },
    });

    if (!studentClass) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "There is not Student Class, you must add student first!");
    }

    const attendances = await db.attendance.findMany({
      where: {
        classId: existedClass.id,
        date: transformDate(date),
      },
      select: {
        id: true,
        status: true,
        date: true,
        student: {
          select: {
            id: true,
            nisn: true,
            name: true,
          },
        },
      },
    });

    // Create a map of student ID to attendance record for quick lookup
    const attendanceMap = new Map(attendances.map((att) => [att.student.id, att]));

    const newAtt = [];
    const changedAttd = [];

    // Prepare the final list of attendance records, including defaults for missing students
    studentClass.forEach((stdClass, _idx) => {
      const student = stdClass?.student;
      if (attendanceMap.has(student.id)) {
        const existingStudentAttd = attendanceMap.get(student.id);
        changedAttd.push({
          id: existingStudentAttd.id,
          status: status,
          date: transformDate(date),
          studentId: existingStudentAttd.student.id,
          classId: existedClass.id,
        });
      } else {
        newAtt.push({
          status: status,
          date: transformDate(date),
          studentId: student.id,
          classId: existedClass.id,
        });
      }
    });

    try {
      await db.$transaction(async (prisma) => {
        if (newAtt.length > 0) {
          await prisma.attendance.createMany({
            data: newAtt,
          });
        }

        if (changedAttd.length > 0) {
          const updatePromises = changedAttd.map((attendance) =>
            prisma.attendance.update({
              where: {
                id: attendance.id,
              },
              data: {
                status: attendance.status,
              },
            })
          );

          await Promise.all(updatePromises);
        }
      });
    } catch (error) {
      console.error("Error processing attendance records:", error);
      throw new APIError(API_STATUS_CODE.SERVER_ERROR, `failed create bulk create or update attendance to ${status}`);
    }

    const totalAttd = [...newAtt, ...changedAttd];

    const formattedResponJson = {
      date: transformDate(date),
      teacher: {
        id: existedClass.teacher?.id,
        name: existedClass.teacher?.user?.name,
      },
      class: {
        id: existedClass.id,
        name: existedClass.name,
      },
      attendances: totalAttd,
    };

    return formattedResponJson;
  }

  static async getWeeklyStudentAttendance(listOfWeek, student, classes) {
    const attendances = await db.attendance.findMany({
      where: {
        studentId: student.id,
        classId: classes?.id,
        date: {
          gte: listOfWeek[0],
          lte: listOfWeek[listOfWeek.length - 1],
        },
      },
      select: {
        status: true,
        date: true,
        student: {
          select: {
            id: true,
            nisn: true,
            name: true,
          },
        },
      },
    });

    const attendanceMap = new Map(attendances.map((att) => [`${student.id}-${att.date.toISOString().split("T")[0]}`, att]));

    // Prepare the final JSON structure
    const weeklyAttendance = {
      percentagePresent: 0, // Initialize percentagePresent
      dates: {
        start: listOfWeek[0],
        end: listOfWeek[listOfWeek.length - 1],
      },
      attendances: [],
    };

    let presentCount = 0;
    let validDayCount = 0;

    listOfWeek.forEach((date) => {
      const key = `${student.id}-${date.toISOString().split("T")[0]}`;
      if (attendanceMap.has(key)) {
        const status = attendanceMap.get(key).status;
        if (status !== "HOLIDAY") {
          validDayCount++;
          if (status === "PRESENT") {
            presentCount++;
          }
          weeklyAttendance.attendances.push({
            date: date.toISOString().split("T")[0],
            status,
          });
        } else {
          weeklyAttendance.attendances.push({
            date: date.toISOString().split("T")[0],
            status: "HOLIDAY",
          });
        }
      } else {
        validDayCount++;
        weeklyAttendance.attendances.push({
          date: date.toISOString().split("T")[0],
          status: "ABSENT",
        });
      }
    });

    // Calculate the percentage only if there are valid days to consider
    if (validDayCount > 0) {
      weeklyAttendance.percentagePresent = Number(((presentCount / validDayCount) * 100).toFixed(2));
    } else {
      weeklyAttendance.percentagePresent = 0;
    }

    return weeklyAttendance;
  }

  static async studentWeeklyList(request) {
    checkAllowedRole(ROLE.IS_ADMIN_TEACHER, request?.loggedUserRole);

    if (!request?.classId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Class Id not inputted!");
    }
    if (!request?.studentId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Student Id not inputted!");
    }

    if (!request?.week || !request?.month || !request?.year) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "invalid week, month, and year inputted!");
    }

    // Convert the components to numbers
    const year = Number(request?.year);
    const month = Number(request?.month);
    const week = Number(request?.week);

    const listOfWeek = getWeekMonToSaturdayDates(year, month, week);

    const existedClass = await db.class.findUnique({
      where: {
        id: request?.classId,
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
              },
            },
          },
        },
      },
    });

    if (!existedClass) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "Class not found!");
    }

    const existedStudent = await db.student.findUnique({
      where: {
        id: request?.studentId,
      },
    });

    if (!existedStudent) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "Student not found!");
    }

    const weeklyAttendance = await this.getWeeklyStudentAttendance(listOfWeek, existedStudent, existedClass);

    return {
      student: {
        id: existedStudent.id,
        name: existedStudent.name,
        nisn: existedStudent.nisn,
      },
      teacher: {
        id: existedClass.teacher.id,
        name: existedClass.teacher.user.name,
      },
      class: {
        id: existedClass.id,
        name: existedClass.name,
      },
      attendances: weeklyAttendance,
    };
  }

  static async studentMonthlyList(request) {
    checkAllowedRole(ROLE.IS_ADMIN_TEACHER, request?.loggedUserRole);

    if (!request?.classId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Class Id not inputted!");
    }
    if (!request?.studentId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Student Id not inputted!");
    }

    if (!request?.month || !request?.year) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "invalid week, month, and year inputted!");
    }

    // Convert the components to numbers
    const year = Number(request?.year);
    const month = Number(request?.month);

    const listOfWeekOne = getWeekMonToSaturdayDates(year, month, 1);
    const listOfWeekTwo = getWeekMonToSaturdayDates(year, month, 2);
    const listOfWeekThree = getWeekMonToSaturdayDates(year, month, 3);
    const listOfWeekFour = getWeekMonToSaturdayDates(year, month, 4);

    const existedClass = await db.class.findUnique({
      where: {
        id: request?.classId,
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
              },
            },
          },
        },
      },
    });

    if (!existedClass) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "Class not found!");
    }

    const existedStudent = await db.student.findUnique({
      where: {
        id: request?.studentId,
      },
    });

    if (!existedStudent) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "Student not found!");
    }

    const weekOneAttendance = await this.getWeeklyStudentAttendance(listOfWeekOne, existedStudent, existedClass);
    const weekTwoAttendance = await this.getWeeklyStudentAttendance(listOfWeekTwo, existedStudent, existedClass);
    const weekThreeAttendance = await this.getWeeklyStudentAttendance(listOfWeekThree, existedStudent, existedClass);
    const weekFourAttendance = await this.getWeeklyStudentAttendance(listOfWeekFour, existedStudent, existedClass);

    return {
      student: {
        id: existedStudent.id,
        name: existedStudent.name,
        nisn: existedStudent.nisn,
      },
      teacher: {
        id: existedClass.teacher.id,
        name: existedClass.teacher.user.name,
      },
      class: {
        id: existedClass.id,
        name: existedClass.name,
      },
      week_1: weekOneAttendance,
      week_2: weekTwoAttendance,
      week_3: weekThreeAttendance,
      week_4: weekFourAttendance,
    };
  }

  static async dailyList(request) {
    checkAllowedRole(ROLE.IS_ADMIN_TEACHER, request?.loggedUserRole);

    if (!request?.classId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Class Id not inputted!");
    }

    if (!request?.date) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "date not inputted!");
    }

    const existedClass = await db.class.findUnique({
      where: {
        id: request?.classId,
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
              },
            },
          },
        },
      },
    });

    if (!existedClass) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "Class not found!");
    }

    const studentClass = await db.studentClass.findMany({
      where: {
        classId: existedClass.id,
      },
      select: {
        student: true,
      },
    });

    if (!studentClass) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "There is not Student Class, you must add student first!");
    }

    const attendances = await db.attendance.findMany({
      where: {
        classId: existedClass.id,
        date: transformDate(request?.date),
      },
      select: {
        status: true,
        date: true,
        student: {
          select: {
            id: true,
            nisn: true,
            name: true,
          },
        },
      },
    });

    // Create a map of student ID to attendance record for quick lookup
    const attendanceMap = new Map(attendances.map((att) => [att.student.id, att]));

    const attd = [];

    // Prepare the final list of attendance records, including defaults for missing students
    studentClass.forEach((stdClass, index) => {
      const student = stdClass?.student;
      if (attendanceMap.has(student.id)) {
        attd.push({
          ...attendanceMap.get(student.id),
        });
      } else {
        attd.push({
          status: "ABSENT",
          date: transformDate(request?.date),
          student: {
            id: student.id,
            nisn: student.nisn,
            name: student.name,
          },
        });
      }
    });

    const sortedAtt = {
      date: transformDate(request?.date),
      teacher: {
        id: existedClass.teacher?.id,
        name: existedClass.teacher?.user?.name,
      },
      class: {
        id: existedClass.id,
        name: existedClass.name,
      },
      attendances:
        attd.length > 0
          ? attd.sort((a, b) => {
              if (a.student.name < b.student.name) return -1;
              if (a.student.name > b.student.name) return 1;
              return 0;
            })
          : [],
    };

    return sortedAtt;
  }

  static async weeklyList(request) {
    checkAllowedRole(ROLE.IS_ADMIN_TEACHER, request?.loggedUserRole);

    if (!request?.classId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Class Id not inputted!");
    }

    if (!request?.week || !request?.month || !request?.year) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "invalid week, month, and year inputted!");
    }

    // Convert the components to numbers
    const year = Number(request?.year);
    const month = Number(request?.month);
    const week = Number(request?.week);

    const listOfWeek = getWeekMonToSaturdayDates(year, month, week);

    const existedClass = await db.class.findUnique({
      where: {
        id: request?.classId,
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
              },
            },
          },
        },
      },
    });

    if (!existedClass) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "Class not found!");
    }

    const attendances = await db.attendance.findMany({
      where: {
        classId: existedClass.id,
        date: {
          gte: listOfWeek[0],
          lte: listOfWeek[listOfWeek.length - 1],
        },
      },
      select: {
        status: true,
        date: true,
        student: {
          select: {
            id: true,
            nisn: true,
            name: true,
          },
        },
      },
    });

    const studentClass = await db.studentClass.findMany({
      where: {
        classId: existedClass.id,
      },
      select: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            nisn: true,
            gender: true,
            no_telp: true,
            parent: true,
          },
        },
      },
    });

    if (!studentClass) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "There is not Student Class, you must add student first!");
    }

    const attendanceMap = new Map(attendances.map((att) => [`${att.student.id}-${att.date.toISOString().split("T")[0]}`, att]));

    // Prepare the final JSON structure
    const weeklyAttendance = {
      teacher: {
        id: existedClass.teacher.id,
        name: existedClass.teacher.user.name,
      },
      class: {
        id: existedClass.id,
        name: existedClass.name,
      },
      students: [],
    };

    listOfWeek.forEach((date) => {
      studentClass.forEach((stdClass) => {
        const student = stdClass?.student;
        const attendanceForDay = [];
        const key = `${student.id}-${date.toISOString().split("T")[0]}`;
        if (attendanceMap.has(key)) {
          attendanceForDay.push({
            date: date.toISOString().split("T")[0],
            status: attendanceMap.get(key).status,
          });
        } else {
          attendanceForDay.push({
            date: date.toISOString().split("T")[0],
            status: "ABSENT",
          });
        }
        // Find the student in the current week and update their attendance
        let studentEntry = weeklyAttendance.students.find((s) => s.id === student.id);
        if (!studentEntry) {
          studentEntry = {
            id: student.id,
            nisn: student.nisn,
            name: student.name,
            parent: {
              id: student?.parent?.id ?? null,
              name: student?.parent?.user?.name ?? null,
            },
            attendance: [],
          };
          weeklyAttendance.students.push(studentEntry);
        }
        studentEntry?.attendance?.push(...attendanceForDay);
      });
    });

    return weeklyAttendance;
  }

  static async createOrUpdate(request) {
    checkAllowedRole(ROLE.IS_ADMIN_TEACHER, request?.loggedUserRole);

    if (!request?.classId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Class Id not inputted!");
    }

    if (!request?.studentId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Student Id not inputted!");
    }

    if (!request?.date) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "date not inputted!");
    }

    if (!request?.status) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "absent status not inputted!");
    }

    const existedClass = await db.class.findUnique({
      where: {
        id: request?.classId,
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
              },
            },
          },
        },
      },
    });

    if (!existedClass) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "Class not found!");
    }

    const studentAttendance = await db.attendance.findFirst({
      where: {
        classId: request?.classId,
        date: transformDate(request?.date),
        studentId: request?.studentId,
      },
    });

    let attd;

    if (!studentAttendance) {
      attd = await db.attendance.create({
        data: {
          status: request?.status,
          date: transformDate(request?.date),
          studentId: request?.studentId,
          classId: request.classId,
        },
        select: {
          status: true,
          date: true,
          student: {
            select: {
              id: true,
              nisn: true,
              name: true,
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
            },
          },
        },
      });
    } else {
      attd = await db.attendance.update({
        where: {
          id: studentAttendance.id,
        },
        data: {
          status: request?.status,
          date: transformDate(request?.date),
        },
        select: {
          status: true,
          date: true,
          student: {
            select: {
              id: true,
              nisn: true,
              name: true,
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
            },
          },
        },
      });
    }

    const formatterAttendance =
      Object.keys(attd).length > 0
        ? {
            status: attd.status,
            date: attd.date,
            student: {
              id: attd?.student.id,
              nisn: attd?.student.nisn,
              name: attd?.student.name,
            },
            teacher: {
              id: existedClass.teacher.id,
              name: existedClass.teacher.user.name,
            },
            parent: {
              id: attd?.student?.parent?.id ?? null,
              name: attd?.student.parent?.user?.name ?? null,
            },
            class: {
              id: existedClass.id,
              name: existedClass.name,
            },
          }
        : attd;

    return formatterAttendance;
  }

  static async createOrUpdateStudentToAllPresent(request) {
    checkAllowedRole(ROLE.IS_ADMIN_TEACHER, request?.loggedUserRole);

    const createAllPresentAttendance = await this.createOrUpdateBulkAttendance(request?.classId, request?.date, "PRESENT");

    return createAllPresentAttendance;
  }

  static async createOrUpdateStudentToAllAbsent(request) {
    checkAllowedRole(ROLE.IS_ADMIN_TEACHER, request?.loggedUserRole);

    const createAllAbsentAttendance = await this.createOrUpdateBulkAttendance(request?.classId, request?.date, "ABSENT");

    return createAllAbsentAttendance;
  }

  static async createOrUpdateStudentToAllHoliday(request) {
    checkAllowedRole(ROLE.IS_ADMIN_TEACHER, request?.loggedUserRole);

    const createAllHolidayAttendance = await this.createOrUpdateBulkAttendance(request?.classId, request?.date, "HOLIDAY");

    return createAllHolidayAttendance;
  }

  static async createOrUpdateStudentToAllLate(request) {
    checkAllowedRole(ROLE.IS_ADMIN_TEACHER, request?.loggedUserRole);

    const createAllLateAttendance = await this.createOrUpdateBulkAttendance(request?.classId, request?.date, "LATE");

    return createAllLateAttendance;
  }
}
