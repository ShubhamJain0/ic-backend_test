import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../../../lib/mongodb";
import { hashPassword, verifyPassword } from "../../../../lib/helpers";
import NextCors from "nextjs-cors";
import { generateJWTToken } from "../../../../lib/helpers/jwt";
import { formatError } from "../../../../lib/helpers/errors";
import { ObjectId } from "mongodb";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }
  try {
    const client = await clientPromise;
    const db = client.db("tc_db").collection("users");
    const { user_id }: any = req.headers;

    const old_password = req.body?.old_password || "";
    const new_password = req.body?.new_password || "";
    const name = req.body?.name || "";

    if (!old_password && !new_password && !name) {
      return res.status(400).json({ message: "Atleast one field is required" });
    }

    //Check if user exists
    const objectId = new ObjectId(user_id);
    const getUser = await db.findOne({ _id: objectId });
    if (!getUser) {
      return res.status(404).json({ message: "User does not exist" });
    }

    if (old_password && new_password) {
      //Check for password
      const isCorrectPassword = await verifyPassword(
        old_password,
        getUser?.password
      );
      if (!isCorrectPassword) {
        return res.status(400).json({ message: "Incorrect password" });
      }

      //Hash new password and update password
      const hashedPassword = await hashPassword(new_password);
      await db.updateOne(
        { _id: objectId },
        { $set: { password: hashedPassword } }
      );
    }

    if (name) {
      await db.updateOne({ _id: objectId }, { $set: { name: name } });
    }

    return res.status(200).json({
      message: "Profile updated",
    });
  } catch (e: any) {
    const errResp = formatError(
      500,
      "Something went wrong",
      "Update Profile",
      e
    );
    return res.status(errResp.status).json({
      message: errResp.message,
      cause: errResp.cause,
    });
  }
};
