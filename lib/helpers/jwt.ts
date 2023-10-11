import { SignJWT, jwtVerify } from "jose";
import { AES, enc } from "crypto-js";

const encryptKey = process.env.ENCRYPT_KEY;
const jwtSecret = process.env.JWT_SECRET_KEY;

export const encrypt = (text: string) => {
  try {
    text = AES.encrypt(text, encryptKey as string).toString();
    return text;
  } catch (error) {
    throw error;
  }
};

export const decrypt = (text: string) => {
  try {
    let bytes = AES.decrypt(text, encryptKey as string);
    let decryptedText = bytes.toString(enc.Utf8);
    return decryptedText;
  } catch (error) {
    return "";
  }
};

export const generateJWTToken = async (payload: any) => {
  try {
    const iat = Math.floor(Date.now() / 1000);
    const expiryTime = iat + 7 * 24 * 60 * 60; // 7 days in seconds
    let authToken = await new SignJWT({ ...payload })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expiryTime)
      .setIssuedAt(iat)
      .setNotBefore(iat)
      .sign(new TextEncoder().encode(jwtSecret as string));

    let refreshToken = await new SignJWT({ ...payload })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuedAt(iat)
      .setNotBefore(iat)
      .sign(new TextEncoder().encode(jwtSecret as string));

    authToken = encrypt(authToken);
    refreshToken = encrypt(refreshToken);

    return { authToken, refreshToken };
  } catch (e) {
    throw new Error(`Failed to generate Token : ${e}`);
  }
};

export const verifyJWTToken = async (token: string) => {
  try {
    let decryptedToken = decrypt(token);
    let decodedToken = await jwtVerify(
      decryptedToken,
      new TextEncoder().encode(jwtSecret as string)
    );
    return decodedToken.payload;
  } catch (e) {
    return new Error(`Token is invalid or expired : ${e}`);
  }
};
