import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";

const network = (process.env.NEXT_PUBLIC_SUI_NETWORK as "mainnet" | "testnet" | "devnet") || "testnet";

export const suiClient = new SuiClient({ url: getFullnodeUrl(network) });

// New (upgraded) package ID — used for transaction calls
export const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID || "";
// Original package ID — events are always emitted under the original ID on Sui upgrades
export const ORIGINAL_PACKAGE_ID = process.env.NEXT_PUBLIC_ORIGINAL_PACKAGE_ID || PACKAGE_ID;
export const MODULE_NAME = "donation_platform";

export interface Campaign {
  id: string;
  creator: string;
  title: string;
  description: string;
  charity_type: string;
  goal_amount: number;
  total_donated: number;
  active: boolean;
}

// Fetch all Campaign shared objects owned/created by the package.
// We query events emitted on creation to discover campaign object IDs.
export async function getCampaigns(): Promise<Campaign[]> {
  if (!PACKAGE_ID) return [];
  try {
    const events = await suiClient.queryEvents({
      query: { MoveEventType: `${ORIGINAL_PACKAGE_ID}::${MODULE_NAME}::CampaignCreated` },
      limit: 50,
    });

    const ids = events.data.map((e) => (e.parsedJson as any).campaign_id as string);
    if (ids.length === 0) return [];

    const objects = await suiClient.multiGetObjects({
      ids,
      options: { showContent: true },
    });

    return objects
      .filter((o) => o.data?.content?.dataType === "moveObject")
      .map((o) => {
        const fields = (o.data!.content as any).fields;
        return {
          id: o.data!.objectId,
          creator: fields.creator,
          title: fields.title,
          description: fields.description,
          charity_type: fields.charity_type,
          goal_amount: Number(fields.goal_amount),
          total_donated: Number(fields.total_donated),
          active: fields.active,
        } as Campaign;
      });
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return [];
  }
}

export interface DonorStats {
  address: string;
  totalDonated: number;
  donationCount: number;
}

// Aggregate donation events for the leaderboard
export async function getDonorStats(): Promise<DonorStats[]> {
  if (!PACKAGE_ID) return [];
  try {
    const events = await suiClient.queryEvents({
      query: { MoveEventType: `${ORIGINAL_PACKAGE_ID}::${MODULE_NAME}::DonationMade` },
      limit: 200,
    });

    const donorMap = new Map<string, DonorStats>();
    for (const e of events.data) {
      const { donor, amount } = e.parsedJson as any;
      const existing = donorMap.get(donor);
      if (existing) {
        existing.totalDonated += Number(amount);
        existing.donationCount += 1;
      } else {
        donorMap.set(donor, { address: donor, totalDonated: Number(amount), donationCount: 1 });
      }
    }

    return Array.from(donorMap.values()).sort((a, b) => b.totalDonated - a.totalDonated);
  } catch (error) {
    console.error("Error fetching donor stats:", error);
    return [];
  }
}
