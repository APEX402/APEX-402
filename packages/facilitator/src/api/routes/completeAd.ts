import type { Request, Response } from "express";
import { verifyMessage } from 'viem';
import { privateKeyToAccount } from "viem/accounts";
import { createWalletClient, http } from "viem";
import { settleAdPayment } from "../../../../core/src/facilitator/settleAd";
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

    console.log("/complete-ad go req body", req.body);

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

    const walletClient = createWalletClient({
      chain: {
        id: 97,
        name: "BSC Testnet",
        rpcUrls: {
          default: { http: ["https://bsc-testnet.bnbchain.org"] },
          public: { http: ["https://bsc-testnet.bnbchain.org"] },
        },
        nativeCurrency: {
          name: "BNB",
          symbol: "BNB",
          decimals: 18,
        },
      },
      transport: http("https://bsc-testnet.bnbchain.org"),
      account,
    });

    const result = await settleAdPayment(walletClient, {
      networkId: "bsc-testnet",
      to: "0x268DE765aeC0799CEAE45012F4C73f823d146c21",
      amount: BigInt(10000000000000000),
    });

    const safeResult = {
      ...result,
      blockNumber: result.blockNumber?.toString(),
    };


    res.json({
      verified: true,
      result: safeResult,
    });

  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

