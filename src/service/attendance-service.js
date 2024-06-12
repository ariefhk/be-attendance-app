import { db } from "../application/db.js";
import { APIError } from "../error/api-error.js";
import { ROLE, roleCheck } from "../helper/allowed-role.js";
import { API_STATUS_CODE } from "../helper/status-code.js";
import { transformDate, getWeekMonToSaturdayDates } from "../helper/date.js";

export class AttendanceService {
  static async studentWeeklyList(request) {
    if (!roleCheck(ROLE.IS_ADMIN_TEACHER, request?.loggedUserRole)) {
      throw new APIError(API_STATUS_CODE.FORBIDDEN, "You dont have access to this!");
    }

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

    const attendances = await db.attendance.findMany({
      where: {
        studentId: existedStudent.id,
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

    const attendanceMap = new Map(
      attendances.map((att) => [`${existedStudent.id}-${att.date.toISOString().split("T")[0]}`, att])
    );

    // Prepare the final JSON structure
    const weeklyAttendance = {
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
      dates: {
        start: listOfWeek[0],
        end: listOfWeek[listOfWeek.length - 1],
      },
      attendances: [],
    };

    listOfWeek.forEach((date) => {
      const key = `${existedStudent.id}-${date.toISOString().split("T")[0]}`;
      if (attendanceMap.has(key)) {
        weeklyAttendance.attendances.push({
          date: date.toISOString().split("T")[0],
          status: attendanceMap.get(key).status,
        });
      } else {
        weeklyAttendance.attendances.push({
          date: date.toISOString().split("T")[0],
          status: "ABSENT",
        });
      }
    });

    return weeklyAttendance;
  }

  static async dailyList(request) {
    if (!roleCheck(ROLE.IS_ADMIN_TEACHER, request?.loggedUserRole)) {
      throw new APIError(API_STATUS_CODE.FORBIDDEN, "You dont have access to this!");
    }

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
        student: {
          select: {
            id: true,
            nisn: true,
            name: true,
          },
        },
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

    const newDefaultAttendance = [];
    const attd = [];

    // Prepare the final list of attendance records, including defaults for missing students
    existedClass.student.forEach((student, index) => {
      if (attendanceMap.has(student.id)) {
        attd.push({
          no_student: index + 1,
          ...attendanceMap.get(student.id),
        });
      } else {
        const defaultAttendance = {
          status: "ABSENT",
          date: transformDate(request?.date),
          studentId: student.id,
          classId: request.classId,
        };
        // newDefaultAttendance.push(defaultAttendance);
        attd.push({
          no_student: index + 1,
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

    if (newDefaultAttendance.length > 0) {
      await db.attendance.createMany({
        data: newDefaultAttendance,
      });
    }

    const sortedAtt = {
      date: transformDate(request?.date),
      teacher: {
        id: existedClass.teacher?.id,
        name: existedClass.teacher?.user?.name,
      },
      class: existedClass.name,
      student_attendance:
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
    if (!roleCheck(ROLE.IS_ADMIN_TEACHER, request?.loggedUserRole)) {
      throw new APIError(API_STATUS_CODE.FORBIDDEN, "You dont have access to this!");
    }

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
      existedClass.student.forEach((student) => {
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
              id: student.parent.id,
              name: student.parent.user.name,
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

  static async list(request) {
    if (!roleCheck(ROLE.IS_ADMIN_TEACHER, request?.loggedUserRole)) {
      throw new APIError(API_STATUS_CODE.FORBIDDEN, "You dont have access to this!");
    }

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
        student: {
          select: {
            id: true,
            nisn: true,
            name: true,
          },
        },
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
        date: new Date(request?.date),
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

    const newDefaultAttendance = [];
    const attd = [];

    // Prepare the final list of attendance records, including defaults for missing students
    existedClass.student.forEach((student, index) => {
      if (attendanceMap.has(student.id)) {
        attd.push({
          no_student: index + 1,
          ...attendanceMap.get(student.id),
        });
      } else {
        const defaultAttendance = {
          status: "ABSENT",
          date: new Date(request?.date),
          studentId: student.id,
          classId: request.classId,
        };
        newDefaultAttendance.push(defaultAttendance);
        attd.push({
          no_student: index + 1,
          status: "ABSENT",
          date: new Date(request?.date),
          student: {
            id: student.id,
            nisn: student.nisn,
            name: student.name,
          },
        });
      }
    });

    if (newDefaultAttendance.length > 0) {
      await db.attendance.createMany({
        data: newDefaultAttendance,
      });
    }

    const sortedAtt = {
      teacher: {
        id: existedClass.teacher?.id,
        name: existedClass.teacher?.user?.name,
      },
      class: existedClass.name,
      student_attendance:
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

  static async createOrUpdate(request) {
    if (!roleCheck(ROLE.IS_ADMIN, request?.loggedUserRole)) {
      throw new APIError(API_STATUS_CODE.FORBIDDEN, "You dont have access to this!");
    }

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

    const studentAttendance = await db.attendance.findFirst({
      where: {
        classId: request?.classId,
        date: new Date(request?.date),
        studentId: request?.studentId,
      },
    });

    let attd;

    if (!studentAttendance) {
      attd = await db.attendance.create({
        data: {
          status: request?.status,
          date: new Date(request?.date),
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
          date: new Date(request?.date),
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
            parent: {
              id: attd?.student?.parent?.id ?? null,
              name: attd?.student.parent?.user?.name ?? null,
            },
          }
        : attd;

    return formatterAttendance;
  }

  static async update(request) {
    if (!roleCheck(ROLE.IS_ADMIN, request?.loggedUserRole)) {
      throw new APIError(API_STATUS_CODE.FORBIDDEN, "You dont have access to this!");
    }
  }

  static async delete(request) {
    if (!roleCheck(ROLE.IS_ADMIN, request?.loggedUserRole)) {
      throw new APIError(API_STATUS_CODE.FORBIDDEN, "You dont have access to this!");
    }
  }
}
