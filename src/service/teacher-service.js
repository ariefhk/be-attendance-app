import { db } from "../db/db-connetor.js";
import { APIError } from "../error/api-error.js";
import { ROLE, roleCheck } from "../helper/allowed-role.js";
import { API_STATUS_CODE } from "../helper/status-code.js";

export class TeacherService {
  static async list(request) {
    if (!roleCheck(ROLE.IS_ADMIN_TEACHER, request?.loggedUserRole)) {
      throw new APIError(API_STATUS_CODE.FORBIDDEN, "You dont have access to this!");
    }

    const teachers = await db.teacher.findMany({
      select: {
        id: true,
        nip: true,
        class: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdAt: true,
      },
    });

    const formattedParrents =
      teachers.length > 0
        ? teachers.map((tc) => ({
            id: tc.id,
            nip: tc.nip,
            name: tc.user.name,
            email: tc.user.email,
            classes:
              tc.class.length > 0
                ? tc.class.map((cl) => ({
                    id: cl.id,
                    name: cl.name,
                  }))
                : [],
            createdAt: tc.createdAt,
          }))
        : [];

    return formattedParrents;
  }
}
