import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

const network = process.env.NEXT_PUBLIC_APTOS_NETWORK === "mainnet"
  ? Network.MAINNET
  : Network.TESTNET;
const config = new AptosConfig({ network });
export const aptos = new Aptos(config);

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";
export const MODULE_NAME = "donation_platform";

export interface Campaign {
  id: number | string;
  creator: string;
  title: string;
  description: string;
  charity_type: string;
  goal_amount: number;
  total_donated: number;
  active: boolean;
}

export interface Donation {
  donor: string;
  amount: number;
  campaign_id: number;
}

export async function getCampaigns(): Promise<Campaign[]> {
  try {
    const result = await aptos.view({
      payload: {
        function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::get_campaigns`,
        typeArguments: [],
        functionArguments: [CONTRACT_ADDRESS],
      }
    });
    return result[0] as Campaign[];
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return [];
  }
}

export async function getDonations(): Promise<Donation[]> {
  try {
    const result = await aptos.view({
      payload: {
        function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::get_donations`,
        typeArguments: [],
        functionArguments: [CONTRACT_ADDRESS],
      }
    });
    return result[0] as Donation[];
  } catch (error) {
    console.error("Error fetching donations:", error);
    return [];
  }
}
