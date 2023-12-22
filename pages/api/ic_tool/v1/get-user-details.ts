import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../../../lib/mongodb";
import { formatError } from "../../../../lib/helpers/errors";
import { ObjectId } from "mongodb";
import NextCors from "nextjs-cors";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }
  try {
    const { user_id }: any = req.headers;

    const client = await clientPromise;
    const db = client.db("tc_db").collection("users");

    const objectId = new ObjectId(user_id);
    const user = await db.findOne({ _id: objectId });

    return res.status(200).json({
      message: "User details fetched successfully",
      payload: {
        name: user?.name,
        email: user?.email,
        isVerified: user?.isVerified,
      },
    });
  } catch (e: any) {
    const errResp = formatError(500, "Something went wrong", "Get Users", e);
    return res.status(errResp.status).json({
      message: errResp.message,
      cause: errResp.cause,
    });
  }
};
