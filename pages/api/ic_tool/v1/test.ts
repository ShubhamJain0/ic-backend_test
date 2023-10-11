import { NextApiRequest, NextApiResponse } from "next";
import NextCors from "nextjs-cors";

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
    const body = req.body;

    // console.log("body", body);

    return res.status(200).json({
      message: "Success",
    });
  } catch (e: any) {
    // const errResp = formatError(500, "Something went wrong", "Test", e);
    return res.status(500).json({
      message: e,
      cause: e,
    });
  }
};

export const config = {
  api: {
    bodyParser: false,
  },
};
