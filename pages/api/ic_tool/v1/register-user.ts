import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../../../lib/mongodb";
import { checkIfEmailExist, hashPassword } from "../../../../lib/helpers";
import NextCors from "nextjs-cors";
import { generateJWTToken } from "../../../../lib/helpers/jwt";
import { formatError } from "../../../../lib/helpers/errors";
import {
  sendEmail,
  sendEmailUsingTemplate,
} from "../../../../lib/helpers/mailchimp";
import { SignJWT } from "jose";

const jwtSecret = process.env.JWT_SECRET_KEY;
const frontendUrl = process.env.FRONTEND_URL;

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
    const { name, email, company, password } = req.body;

    //Email and password is required
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password is required" });
    }

    const emailExists = await checkIfEmailExist(db, email);

    if (emailExists) {
      return res
        .status(400)
        .json({ message: `Email ${email} already in use!` });
    }
    //@ToDo: do data validtion

    //hash password
    const hashedPassword = await hashPassword(password);

    //Generate verification token which will be used to verify user
    const iat = Math.floor(Date.now() / 1000);
    const expiryTime = iat + 24 * 60 * 60; // 1 day validity
    let verificationToken = await new SignJWT({ email: email })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expiryTime)
      .setIssuedAt(iat)
      .setNotBefore(iat)
      .sign(new TextEncoder().encode(jwtSecret as string));

    const newUser = await db.insertOne({
      name,
      email,
      company,
      password: hashedPassword,
      isVerified: false,
      verificationToken,
    });

    let authTokens;
    if (newUser.acknowledged) {
      authTokens = await generateJWTToken({
        id: newUser.insertedId.id.toString("hex"),
      });
      await sendEmailUsingTemplate({
        subject: "Verify Email",
        to_email: `${email}`,
        template_content: [
          { name: "name", content: `${name}` },
          {
            name: "link",
            content: `<a href="${frontendUrl}?verify_email=${verificationToken}" style="text-decoration: none;color: white;">Verify Email</a>`,
          },
        ],
        template_name: "Verify Email",
      });
    }

    return res.status(201).json({
      message: "New user created",
      payload: { name, email, company, ...authTokens, isVerified: false },
    });
  } catch (e: any) {
    const errResp = formatError(
      500,
      "Something went wrong",
      "User Registration",
      e
    );
    return res.status(errResp.status).json({
      message: errResp.message,
      cause: errResp.cause,
    });
  }
};
