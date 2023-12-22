import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../../../lib/mongodb";
import NextCors from "nextjs-cors";
import { formatError } from "../../../../lib/helpers/errors";
import { SignJWT, jwtVerify } from "jose";
import { convertToBSON } from "../../../../lib/helpers";
import { sendEmail } from "../../../../lib/helpers/mailchimp";
import { ObjectId } from "mongodb";

const jwtSecret = process.env.JWT_SECRET_KEY;
const frontendUrl = process.env.FRONTEND_URL;

//@ToDo: Add auth token system
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

    let email = user?.email;
    const userExists = await db.findOne({ email });

    if (!userExists) {
      return res.status(400).json({
        message: "User does not exist",
      });
    }

    if (userExists.isVerified) {
      return res.status(400).json({
        message: "User already verified",
      });
    }

    //Generate verification token which will be used to verify user
    const iat = Math.floor(Date.now() / 1000);
    const expiryTime = iat + 24 * 60 * 60; // 1 day validity
    let verificationToken = await new SignJWT({ email: email })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expiryTime)
      .setIssuedAt(iat)
      .setNotBefore(iat)
      .sign(new TextEncoder().encode(jwtSecret as string));

    //Update user verification token
    await db.updateOne(
      { email: email },
      { $set: { verificationToken: verificationToken } }
    );

    await sendEmail({
      subject: "Verify Email",
      text: `${frontendUrl}?verify_email=${verificationToken}`,
      to_email: `${email}`,
    });

    return res.status(200).json({
      message: "Email Resent",
    });
  } catch (e: any) {
    const errResp = formatError(500, "Something went wrong", "Email resend", e);
    return res.status(errResp.status).json({
      message: errResp.message,
      cause: errResp.cause,
    });
  }
};
