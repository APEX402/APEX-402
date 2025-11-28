import type { Request, Response } from "express";
import { keccak256, toHex } from 'viem';
import { privateKeyToAccount } from "viem/accounts";
import type { EnvConfig } from "../../config/env";

/**
 * POST /initiate-ad
 * Initiate an ad
 */
export async function handleInitiateAd(
  req: Request,
  res: Response,
  config: EnvConfig,
): Promise<void> {
  try {
    // Validate request body

    console.log("/verify go req body", req.body);

    const payload = {
      adId: "ad123",
      viewerId: "user456",
      price: "100",
      currency: "TOKEN",
      nonce: crypto.randomUUID(),  // prevents replay
      exp: Math.floor(Date.now() / 1000) + 600  // token expires in 10 min
    };

    
    const payloadString = JSON.stringify(payload);
    const payloadHash = keccak256(toHex(Buffer.from(payloadString)));

    const account = privateKeyToAccount(config.sponsorPrivateKey);

    const signature = await account.signMessage({
      message: { raw: payloadHash },
    });

    res.json({
      hash: payloadHash,
      facilitatorSignature: signature
    });
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

