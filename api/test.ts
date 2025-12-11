/**
 * Test function to verify Vercel function deployment
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({ message: "Test function works!", method: req.method });
}

