import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../../../lib/mongodb";
import NextCors from "nextjs-cors";
import { formatError } from "../../../../lib/helpers/errors";
import { jwtVerify } from "jose";

const jwtSecret = process.env.JWT_SECRET_KEY;

//@ToDo: Add auth token system
export default async (req: NextApiRequest, res: NextApiResponse) => {
  await NextCors(req, res, {
    // Options
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
    origin: "*",
    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  });
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }
  try {
    const client = await clientPromise;
    const db = client.db("tc_db").collection("users");
    const { token } = req.body;
    const { user_id } = req.headers;

    let isTokenValid = await jwtVerify(
      token,
      new TextEncoder().encode(jwtSecret as string)
    );

    if (!isTokenValid) {
      return res.status(400).json({
        message: "Invalid token",
      });
    }

    const userExists = await db.findOne({ email: isTokenValid.payload?.email });

    if (!userExists) {
      return res.status(400).json({
        message: "User does not exist",
      });
    }

    if (userExists._id.toString("hex") !== user_id) {
      return res.status(400).json({
        message: "Wrong user id",
      });
    }

    await db.updateOne(
      { email: isTokenValid.payload?.email },
      { $set: { isVerified: true } }
    );

    return res.status(200).json({
      message: "User verified",
      payload: {
        name: userExists.name,
        email: userExists.email,
        isVerified: true,
      },
    });
  } catch (e: any) {
    const errResp = formatError(
      500,
      "Something went wrong",
      "User Verification",
      e
    );
    return res.status(errResp.status).json({
      message: errResp.message,
      cause: errResp.cause,
    });
  }
};
