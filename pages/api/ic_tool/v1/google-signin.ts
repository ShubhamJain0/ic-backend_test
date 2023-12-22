import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../../../lib/mongodb";
import { checkIfEmailExist, hashPassword } from "../../../../lib/helpers";
import NextCors from "nextjs-cors";
import { generateJWTToken } from "../../../../lib/helpers/jwt";
import { googleAuth } from "../../../../lib/helpers/google-auth";
import jwt_decode from "jwt-decode";
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
    //Get google oauth code from request and create tokens which will be used to fetch user details
    const { code } = req.body;
    const tokens = await googleAuth(code);
    const gUser: any = jwt_decode(tokens?.id_token!);

    const client = await clientPromise;
    const db = client.db("tc_db").collection("users");

    //Check if user is already registered
    const emailExists = await checkIfEmailExist(db, gUser?.email);
    let authTokens;

    //If email does not exist create new user
    if (!emailExists) {
      //Generate random password
      const random_pass = crypto.randomUUID();
      const hashedPassword = await hashPassword(random_pass);
      const newUser = await db.insertOne({
        name: gUser?.name,
        email: gUser?.email,
        isVerified: true,
        password: hashedPassword,
      });
      if (newUser.acknowledged) {
        authTokens = await generateJWTToken({
          id: newUser.insertedId.id.toString("hex"),
        });
      }

      return res.status(201).json({
        message: "New user created",
        payload: {
          name: gUser?.name,
          email: gUser?.email,
          ...authTokens,
          isVerified: true,
        },
      });
    } else {
      const getUser = await db.findOne({ email: gUser?.email });
      authTokens = await generateJWTToken({
        id: getUser?._id.toString("hex"),
      });

      return res.status(200).json({
        message: "Signin Successful",
        payload: {
          name: gUser?.name,
          email: gUser?.email,
          ...authTokens,
          isVerified: true,
        },
      });
    }
  } catch (e: any) {
    const errResp = formatError(500, "Something went wrong", "Google OAuth", e);
    return res.status(errResp.status).json({
      message: errResp.message,
      cause: errResp.cause,
    });
  }
};
