import jwt from "jsonwebtoken";

const JWT_ALGORITHM = "HS256" as const;
const JWT_EXPIRES_IN = "8h";

function getSecret(): string {
  const secret = process.env["JWT_SECRET"];
  if (!secret || secret.length < 32) {
    if (process.env["NODE_ENV"] === "production") {
      throw new Error("JWT_SECRET must be set to a secure random string (32+ chars) in production");
    }
    return "scamradar-dev-jwt-secret-do-not-use-in-production-32chars";
  }
  return secret;
}

export interface AdminJwtPayload {
  sub: string;
  role: "admin";
  iat?: number;
  exp?: number;
}

export function signAdminToken(): string {
  const secret = getSecret();
  return jwt.sign({ sub: "admin", role: "admin" }, secret, {
    algorithm: JWT_ALGORITHM,
    expiresIn: JWT_EXPIRES_IN,
  });
}

export function verifyAdminToken(token: string): AdminJwtPayload | null {
  try {
    const secret = getSecret();
    const payload = jwt.verify(token, secret, {
      algorithms: [JWT_ALGORITHM],
    }) as AdminJwtPayload;

    if (payload.role !== "admin") return null;
    return payload;
  } catch {
    return null;
  }
}
