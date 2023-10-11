import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../../../lib/mongodb";
import { checkIfEmailExist, hashPassword } from "../../../../lib/helpers";
import NextCors from "nextjs-cors";
import { generateJWTToken } from "../../../../lib/helpers/jwt";
import { formatError } from "../../../../lib/helpers/errors";

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

    const hashedPassword = await hashPassword(password);

    const newUser = await db.insertOne({
      name,
      email,
      company,
      password: hashedPassword,
    });

    let authTokens;
    if (newUser.acknowledged) {
      authTokens = await generateJWTToken({
        id: newUser.insertedId.id.toString("hex"),
      });
    }

    return res.status(201).json({
      message: "New user created",
      payload: { name, email, company, ...authTokens },
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
