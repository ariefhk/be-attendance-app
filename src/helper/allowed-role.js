export const ROLE = {
  IS_ADMIN: ["ADMIN"],
  IS_ADMIN_PARENT: ["ADMIN", "PARENT"],
  IS_ADMIN_TEACHER: ["ADMIN", "TEACHER"],
  IS_ALL_ROLE: ["ADMIN", "PARENT", "TEACHER"],
};

export const roleCheck = (roles, role) => {
  return roles.includes(role);
};
