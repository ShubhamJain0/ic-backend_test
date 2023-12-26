import { NextApiRequest, NextApiResponse } from "next";
import got from "got";
import NextCors from "nextjs-cors";
import clientPromise from "../../../../lib/mongodb";
import { formatError } from "../../../../lib/helpers/errors";
import { convertToBSON } from "../../../../lib/helpers";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    await NextCors(req, res, {
      // Options
      methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
      origin: "*",
      optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
    });

    const { siteId } = req.body;
    const user_id = convertToBSON(req.headers?.user_id);
    //fetch actual access_token for user_id and site_id form DB
    const client = await clientPromise;
    const db = client.db("tc_db").collection("user_sites");
    const userSiteInfo: any = await db.findOne({ user_id: user_id });
    console.log("User Site Info", userSiteInfo);

    const collectionListResponse = await got.get(
      `https://api.webflow.com/beta/sites/${siteId}/collections`,
      {
        // responseType: "json",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${userSiteInfo.access_token}`,
        },
      }
    );

    const collectionsList: any = collectionListResponse.body;
    console.log("collections", collectionsList.collections);
    let collectionImageList = [];
    for (let collection of collectionsList.collections) {
      const collectionItemResponse = await got.get(
        `https://api.webflow.com/beta/collections/${collection.id}`,
        {
          // responseType: "json",
          headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${userSiteInfo.access_token}`,
          },
        }
      );

      const collectionDetail: any = collectionItemResponse.body;
      const imageFields = collectionDetail.fields
        .filter((e: any) => e.type === "Image" || e.type === "MultiImage")
        .map((item: any) => item.slug);

      const collectionItemsResponse: any = await got.get(
        `https://api.webflow.com/beta/collections/${collection.id}/items`,
        {
          // responseType: "json",
          headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${userSiteInfo.access_token}`,
          },
        }
      );

      const collectionItems = collectionItemsResponse.body.items;
      // console.log("Collection Items >>", collectionItems);
      //item_id, field_id & url
      const finalObj: any = { collectionName: collectionDetail.displayName };
      let imgs = [];
      for (let item of collectionItems) {
        for (let imageField of imageFields) {
          const value = item.fieldData[imageField];
          if (value && Array.isArray(value)) {
            imgs.push(...value);
          } else if (value) {
            imgs.push(value);
          }
        }
        // finalObj["itemId"] = item.id;
        //finalObj["allImgaes"] = imgs;
      }
      finalObj["allImages"] = imgs;

      collectionImageList.push(finalObj);
    }
    console.log("Collection Image List", collectionImageList);

    res
      .status(200)
      .json({ message: "List of CMS Images", payload: collectionImageList });
  } catch (error: any) {
    const errResp = formatError(
      500,
      "Something went wrong",
      "Get CMS Images",
      error
    );
    return res.status(errResp.status).json({
      message: errResp.message,
      cause: errResp.cause,
    });
  }
};
