import type { WalletClient, Address } from "viem";
import { createPublicClient, http } from "viem";
import type { SettlementResult } from "../types/responses";
import { NetworkConfigs, type SupportedNetwork } from "../types/network";
import { TransactionError } from "../utils/errors";

export interface AdPaymentParams {
  networkId: SupportedNetwork;
  to: Address;
  amount: bigint;
}

/**
 * Simple ad payment: send native token from facilitator wallet to a target address
 */
export async function settleAdPayment(
  walletClient: WalletClient,
  params: AdPaymentParams,
): Promise<SettlementResult> {
  try {
    const { networkId, to, amount } = params;

    // Get network config
    const networkConfig = NetworkConfigs[networkId];
    if (!networkConfig) {
      throw new TransactionError(`Unsupported network: ${networkId}`);
    }

    // Wait for confirmation
    const publicClient = createPublicClient({
      chain: {
        id: networkConfig.chainId,
        name: networkConfig.name,
        rpcUrls: {
          default: { http: [networkConfig.rpcUrl] },
          public: { http: [networkConfig.rpcUrl] },
        },
        nativeCurrency: {
          name: "BNB",
          symbol: "BNB",
          decimals: 18,
        },
      },
      transport: http(networkConfig.rpcUrl),
    });

    const hash = await walletClient.sendTransaction({
      account: walletClient.account!,
      to,
      value: amount,
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    return {
      success: receipt.status === "success",
      txHash: hash,
      blockNumber: receipt.blockNumber,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Estimate gas for a simple ad payment settlement
 *
 * For now this returns a fixed placeholder value.
 */
export async function estimateSettlementGas(
  _walletClient: WalletClient,
  _params: AdPaymentParams,
): Promise<bigint> {
  return BigInt(200000);
}

