import type { Request, Response } from "express";
import { verifyMessage } from 'viem';
import { privateKeyToAccount } from "viem/accounts";
import type { EnvConfig } from "../../config/env";

/**
 * POST /complete-ad
 * Complete an ad
 */
export async function handleCompleteAd(
  req: Request,
  res: Response,
  config: EnvConfig,
): Promise<void> {
  try {
    // Validate request body

    console.log("/verify go req body", req.body);

    const { hash, facilitatorSignature } = req.body ?? {};

    if (typeof hash !== "string" || typeof facilitatorSignature !== "string") {
      res.status(400).json({ error: "Missing hash or facilitatorSignature" });
      return;
    }
    
    const account = privateKeyToAccount(config.sponsorPrivateKey);
    const expectedAddress = account.address;

    const valid = await verifyMessage({
      address: expectedAddress,
      message: { raw: hash as any },
      signature: facilitatorSignature as `0x${string}`,
    });

    if (!valid) {
      res.status(400).json({ error: "Invalid facilitator signature" });
      return;
    }
    res.json({
      verified: true,
      facilitator: expectedAddress,
      hash,
    });

  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

