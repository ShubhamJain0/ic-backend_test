import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../../../lib/mongodb";
import { verifyPassword } from "../../../../lib/helpers";
import NextCors from "nextjs-cors";
import { generateJWTToken } from "../../../../lib/helpers/jwt";
import { formatError } from "../../../../lib/helpers/errors";

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
    const { email, password } = req.body;

    //Email and password is required
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password is required" });
    }

    //Check if user exists
    const getUser = await db.findOne({ email });
    if (!getUser) {
      return res.status(404).json({ message: "User does not exist" });
    }

    //Check for password
    const isCorrectPassword = await verifyPassword(password, getUser?.password);
    if (!isCorrectPassword) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    const authTokens = await generateJWTToken({
      id: getUser?._id.toString("hex"),
    });

    return res.status(200).json({
      message: "Login Successful",
      payload: {
        name: getUser?.name,
        email: getUser?.email,
        ...authTokens,
        isVerified: getUser?.isVerified,
      },
    });
  } catch (e: any) {
    const errResp = formatError(500, "Something went wrong", "Login User", e);
    return res.status(errResp.status).json({
      message: errResp.message,
      cause: errResp.cause,
    });
  }
};
