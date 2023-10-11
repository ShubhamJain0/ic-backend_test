import { NextApiRequest, NextApiResponse } from "next";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    res.json({ message: "Yo backend is up!" });
  } catch (e) {
    console.error(e);
  }
};
