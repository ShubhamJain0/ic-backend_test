import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../../../lib/mongodb";
import { formatError } from "../../../../lib/helpers/errors";
import { ObjectId } from "mongodb";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }
  try {
    const { user_id }: any = req.headers;

    const client = await clientPromise;
    const db = client.db("tc_db").collection("user_sites");

    const objectId = new ObjectId(user_id);
    const user = await db.findOne({ _id: objectId });
    let response = [];
    if (user) {
      const allSites = user.sites;
      const recentSites = allSites.sort((a: any, b: any) => {
        return (
          new Date(a.lastUpdated).getTime() > new Date(b.lastUpdated).getTime()
        );
      });

      response = recentSites.map((item: any) => {
        return {
          siteName: item.displayName,
          lastOpened: item.lastUpdated,
          previewUrl: item.previewUrl,
        };
      });
    }

    res.json(response);
  } catch (e: any) {
    const errResp = formatError(500, "Something went wrong", "Get Users", e);
    return res.status(errResp.status).json({
      message: errResp.message,
      cause: errResp.cause,
    });
  }
};
