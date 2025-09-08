import "server-only";
import crypto from "crypto";

const ALG = "aes-256-gcm";

function getKey(): Buffer {
  const b64 = process.env.KEY_ENCRYPTION_KEY;
  if (!b64) throw new Error("Missing KEY_ENCRYPTION_KEY");
  const key = Buffer.from(b64, "base64");
  if (key.length !== 32)
    throw new Error("KEY_ENCRYPTION_KEY must be 32 bytes (base64-encoded)");
  return key;
}

export function encryptAtRest(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALG, key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString("base64")}.${ct.toString("base64")}.${tag.toString(
    "base64"
  )}`;
}

export function decryptAtRest(payload: string): string {
  const [ver, ivB64, ctB64, tagB64] = payload.split(".");
  if (ver !== "v1") throw new Error("Unsupported ciphertext version");
  const key = getKey();
  const iv = Buffer.from(ivB64, "base64");
  const ct = Buffer.from(ctB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const decipher = crypto.createDecipheriv(ALG, key, iv);
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return pt.toString("utf8");
}
