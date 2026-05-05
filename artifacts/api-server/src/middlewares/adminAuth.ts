import type { Request, Response, NextFunction } from "express";

export function adminAuth(req: Request, res: Response, next: NextFunction): void {
  const adminPassword = process.env["ADMIN_PASSWORD"] ?? "scamradar-admin-2024";
  const auth = req.headers["authorization"] ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (token !== adminPassword) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}
