import bcrypt from "bcrypt";

export const bcryptPassword = async (password, salt = 10) => {
  return await bcrypt.hash(password, salt);
};

export const compareBcryptPassword = async (data, encriptedData) => {
  return await bcrypt.compare(data, encriptedData);
};
