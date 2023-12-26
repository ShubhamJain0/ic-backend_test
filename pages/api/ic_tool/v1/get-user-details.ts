import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../../../lib/mongodb";
import { formatError } from "../../../../lib/helpers/errors";
import { ObjectId } from "mongodb";
import NextCors from "nextjs-cors";
import { generateJWTToken, verifyJWTToken } from "../../../../lib/helpers/jwt";

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
    const { authToken, refreshToken }: any = req.body;
    let objectId;
    let authTokens = { authToken: "", refreshToken: "" };

    const client = await clientPromise;
    const db = client.db("tc_db").collection("users");

    //Check if auth token is valid
    const verifiedToken: any = await verifyJWTToken(authToken);

    //If auth token is not valid
    if (!verifiedToken || !verifiedToken.id) {
      //Check if refresh token is valid
      const verifiedRefreshToken: any = await verifyJWTToken(refreshToken);

      //If refresh token is not valid
      if (!verifiedRefreshToken || !verifiedRefreshToken.id) {
        return res.status(401).json({ message: "Invalid Refresh Token" });
      } else {
        authTokens = await generateJWTToken({
          id: verifiedRefreshToken.id,
        });
        objectId = new ObjectId(verifiedRefreshToken.id);
      }
    } else {
      objectId = new ObjectId(verifiedToken.id);
    }

    const user = await db.findOne({ _id: objectId });

    return res.status(200).json({
      message: "User details fetched successfully",
      payload: {
        name: user?.name,
        email: user?.email,
        isVerified: user?.isVerified,
        ...authTokens,
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
