import { db } from "../db/db-connetor.js";
import { ROLE, checkAllowedRole } from "../helper/allowed-role.js";

export class ParentService {
  static async list(request) {
    checkAllowedRole(ROLE.IS_ADMIN_TEACHER, request?.loggedUserRole);

    const parents = await db.parent.findMany({
      select: {
        id: true,
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
            id: true,
            name: true,
            email: true,
            nisn: true,
            studentClass: {
              select: {
                class: {
                  select: {
                    id: true,
                    name: true,
                    teacher: {
                      select: {
                        id: true,
                        user: true,
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

    const formattedParrents =
      parents.length > 0
        ? parents.map((pr) => ({
            id: pr.id,
            name: pr.user.name,
            email: pr.user.email,
            total_children: pr?.student?.length,
            children:
              pr?.student?.length > 0
                ? pr.student.map((std) => ({
                    id: std.id,
                    nisn: std.nisn,
                    name: std.name,
                    email: std.email,
                    classes:
                      std?.studentClass.length > 0
                        ? std?.studentClass.map((stdCls) => {
                            return {
                              id: stdCls?.class?.id ?? null,
                              name: stdCls?.class?.name ?? null,
                              teacher: {
                                id: stdCls?.class?.teacher?.id ?? null,
                                name: stdCls?.class?.teacher?.user?.name ?? null,
                              },
                            };
                          })
                        : [],
                  }))
                : [],
            createdAt: pr.createdAt,
          }))
        : [];

    return formattedParrents;
  }
}
