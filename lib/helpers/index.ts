import bcrypt from "bcrypt";
import { ObjectId } from "mongodb";

export const checkIfEmailExist = async (db, email: string) => {
  let exists = false;
  const matchEmail = await db.findOne({ email }, { _id: 0 });
  console.log("Matching Email Found", matchEmail);
  if (matchEmail) exists = true;
  return exists;
};

export const hashPassword = async (password: string) => {
  return await bcrypt.hash(password, 12);
};

export const verifyPassword = async (password: string, hash: string) => {
  return await bcrypt.compare(password, hash);
};

export const convertToBSON = (data: any) => {
  const objectId = new ObjectId(data);
  return objectId;
};
