import { verifyJWTToken } from "./lib/helpers/jwt";
import { NextRequest, NextResponse } from "next/server";

interface Request extends NextRequest {
  user_id?: string;
}

export const middleware = async (req: Request) => {
  const authToken = req.headers.get("authorization") || "";

  if (!authToken) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const isVerifiedToken: any = await verifyJWTToken(authToken);

  if (!isVerifiedToken || !isVerifiedToken.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const res = NextResponse.next();
  //Set user_id header
  res.headers.set("user_id", isVerifiedToken.id);

  return res;
};

//Add all the routes that need to be protected
export const config = {
  matcher: [
    "/api/ic_tool/v1/get-users/",
    "/api/ic_tool/v1/get-all-cmsImages/",
    "/api/ic_tool/v1/get-all-cmsImages/",
    "/api/hello-world/",
  ],
};
