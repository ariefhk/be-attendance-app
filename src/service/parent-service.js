import { db } from "../application/db.js";
import { APIError } from "../error/api-error.js";
import { ROLE, roleCheck } from "../helper/allowed-role.js";
import { API_STATUS_CODE } from "../helper/status-code.js";

export class ParentService {
  static async list(request) {
    if (!roleCheck(ROLE.IS_ADMIN_TEACHER, request?.loggedUserRole)) {
      throw new APIError(API_STATUS_CODE.FORBIDDEN, "You dont have access to this!");
    }

    const parents = await db.parent.findMany({
      select: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
        student: {
          select: {
            name: true,
          },
        },
        createdAt: true,
      },
    });

    const formattedParrents =
      parents.length > 0
        ? parents.map((pr) => ({
            id: pr.user.id,
            name: pr.user.name,
            email: pr.user.email,
            student_count: pr.student.length,
            student:
              pr.student.length > 0
                ? pr.student.map((student) => ({
                    id: student.id,
                    name: student.name,
                    email: student.email,
                    // Add other student properties as needed
                  }))
                : [],
            createdAt: pr.createdAt,
          }))
        : [];

    return formattedParrents;
  }
}
