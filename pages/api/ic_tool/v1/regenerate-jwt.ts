import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../../../lib/mongodb";
import NextCors from "nextjs-cors";
import { generateJWTToken, verifyJWTToken } from "../../../../lib/helpers/jwt";
import { ObjectId } from "mongodb";
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
    const { refreshtoken } = req.body;

    //If refresh token not in request
    if (!refreshtoken) {
      return res.status(400).json({ message: "Refresh Token is required" });
    }

    //Check if refresh token is valid
    const verifiedToken: any = await verifyJWTToken(refreshtoken);

    if (!verifiedToken || !verifiedToken.id) {
      return res.status(401).json({ message: "Invalid Refresh Token" });
    }

    const objectId = new ObjectId(verifiedToken.id);
    const client = await clientPromise;
    const db = client.db("tc_db").collection("users");
    const getUser = await db.findOne({ _id: objectId });

    //If user does not exist
    if (!getUser) {
      return res.status(401).json({ message: "User doesn't exist" });
    }

    const authTokens = await generateJWTToken({
      id: verifiedToken.id,
    });

    return res.status(200).json({
      message: "New token generated",
      payload: {
        authToken: authTokens.authToken,
      },
    });
  } catch (e: any) {
    const errResp = formatError(
      500,
      "Something went wrong",
      "JWT Regenerate",
      e
    );
    return res.status(errResp.status).json({
      message: errResp.message,
      cause: errResp.cause,
    });
  }
};
