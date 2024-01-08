import { NextApiRequest, NextApiResponse } from "next";
import got from "got";
import NextCors from "nextjs-cors";
import clientPromise from "../../../../lib/mongodb";
import { formatError } from "../../../../lib/helpers/errors";
import { convertToBSON } from "../../../../lib/helpers";

const CLIENT_ID = process.env.WF_CLIENT_ID;
const CLIENT_SECRET = process.env.WF_CLIENT_SECRET;

export default async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    await NextCors(req, res, {
      // Options
      methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
      origin: "*",
      optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
    });

    const user_id = convertToBSON(req.headers?.user_id);

    //const client_id = req.query.client_id;
    // const client_secret = req.query.client_secret;
    const { code } = req.body;
    console.log("Code & user_id", { code, user_id });

    const options = {
      headers: {
        accept: "application/json",
      },
      searchParams: {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        //redirect_url: "http://127.0.0.1:5000/auth-status",
      },
      responseType: "json",
    };

    const authTokenResponse = await got.post(
      `https://api.webflow.com/oauth/access_token`,
      options
    );
    const authData: any = authTokenResponse.body;
    console.log("Oauth Response ::", authData);
    // <!--- This will be moved to an event based flow or SSE
    //get sites (move this into helper function)
    const sitesResponse = await got.get("https://api.webflow.com/beta/sites", {
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${authData?.access_token}`,
      },
      // responseType: "json",
    });
    const sitesData: any = sitesResponse.body;
    console.log("Sites::", sitesData?.sites);
    /* const sitesWithToken = sitesData.sites.map((site) => ({
      ...site,
      access_token: authData.access_token,
    })); */

    //save sites and token in the user_sites collection
    const client = await clientPromise;
    const db = client.db("tc_db").collection("user_sites");
    //check if an item exists with user_id
    const exists = await db.findOneAndUpdate(
      { user_id: user_id },
      {
        $set: {
          access_token: authData.access_token,
          sites: sitesData.sites,
        },
      }
    );
    if (exists.value) {
      console.log("Item with user_id exists: value", exists.value);
    } else {
      const newItem = await db.insertOne({
        user_id: user_id,
        access_token: authData.access_token,
        sites: sitesData.sites,
      });
      if (newItem.acknowledged) {
        console.log("New Item added", newItem);
      }
    }
    // ---!>
    const sites = sitesData.sites?.map(
      ({ id, displayName, previewUrl }: any) => ({
        displayName,
        previewUrl,
        id,
      })
    );

    if (authTokenResponse.statusCode === 200) {
      res
        .status(201)
        .json({ message: "Token updation successful", payload: { sites } });
    }
  } catch (error: any) {
    const errResp = formatError(
      500,
      "Something went wrong",
      "Get Site Token",
      error
    );
    return res.status(errResp.status).json({
      message: errResp.message,
      cause: errResp.cause,
    });
  }
};
