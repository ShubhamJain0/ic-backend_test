import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../../../lib/mongodb";
import { formatError } from "../../../../lib/helpers/errors";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }
  try {
    const client = await clientPromise;
    const db = client.db("tc_db").collection("users");

    const users = await db.find({}).limit(10).toArray();

    res.json(users);
  } catch (e: any) {
    const errResp = formatError(500, "Something went wrong", "Get Users", e);
    return res.status(errResp.status).json({
      message: errResp.message,
      cause: errResp.cause,
    });
  }
};
