import { OAuth2Client } from "google-auth-library";

const oAuth2Client = new OAuth2Client(
  process.env.GOOGLE_AUTH_CLIENT_ID,
  process.env.GOOGLE_AUTH_CLIENT_SECRET,
  "postmessage"
);

export const googleAuth = async (code: string) => {
  const resp = await oAuth2Client.getToken(code);
  return resp.tokens;
};
