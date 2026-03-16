import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { getCampaigns, Campaign, PACKAGE_ID, MODULE_NAME } from "@/lib/suiClient";

const MIST_PER_SUI = 1_000_000_000;

const charityIcons: { [key: string]: string } = {
  Education: "📚",
  Healthcare: "🏥",
  Food: "🍽️",
  Environment: "🌍",
};

export default function CampaignDetails() {
  const router = useRouter();
  const { id } = router.query;
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [donationAmount, setDonationAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) loadCampaign();
  }, [id]);

  const loadCampaign = async () => {
    setPageLoading(true);
    setError(null);
    try {
      const campaigns = await getCampaigns();
      const found = campaigns.find((c) => c.id === id?.toString());
      if (found) {
        setCampaign(found);
      } else {
        setError("Campaign not found");
      }
    } catch (err) {
      console.error("Error loading campaign:", err);
      setError("Failed to load campaign. Please try again.");
    } finally {
      setPageLoading(false);
    }
  };

  const handleDonate = async () => {
    if (!donationAmount || parseFloat(donationAmount) <= 0) {
      alert("Please enter a valid donation amount");
      return;
    }
    if (!account) {
      alert("Please connect your wallet first");
      return;
    }
    setLoading(true);
    try {
      const amountInMist = Math.floor(parseFloat(donationAmount) * MIST_PER_SUI);
      const tx = new Transaction();
      const [coin] = tx.splitCoins(tx.gas, [amountInMist]);
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::donate_to_campaign`,
        arguments: [tx.object(campaign!.id), coin],
      });
      await signAndExecute({ transaction: tx });
      alert("Donation successful! Thank you for your support!");
      setDonationAmount("");
      loadCampaign();
    } catch (error) {
      console.error("Error donating:", error);
      alert("Failed to donate. Please try again.");
    }
    setLoading(false);
  };

  const handleWithdraw = async () => {
    if (!account) { alert("Please connect your wallet first"); return; }
    setLoading(true);
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::withdraw_funds`,
        arguments: [tx.object(campaign!.id)],
      });
      await signAndExecute({ transaction: tx });
      alert("Funds withdrawn successfully!");
      loadCampaign();
    } catch (error) {
      console.error("Error withdrawing:", error);
      alert("Failed to withdraw. Please try again.");
    }
    setLoading(false);
  };

  if (pageLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
        <p className="mt-4 text-gray-600">Loading campaign...</p>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4">😕</div>
        <p className="text-xl font-semibold text-gray-900 mb-2">{error || "Campaign not found"}</p>
        <button onClick={() => router.push("/")}
          className="mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700">
          Back to Campaigns
        </button>
      </div>
    );
  }

  const progress = campaign.goal_amount > 0
    ? (campaign.total_donated / campaign.goal_amount) * 100
    : 0;

  const isCreator = account?.address === campaign.creator;

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white">
          <div className="text-6xl mb-4">{charityIcons[campaign.charity_type] || "💝"}</div>
          <h1 className="text-4xl font-bold mb-2">{campaign.title}</h1>
          <p className="text-indigo-200 font-mono text-sm">ID: {campaign.id.slice(0, 10)}...{campaign.id.slice(-6)}</p>
        </div>

        <div className="p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Campaign</h2>
            <p className="text-gray-700 leading-relaxed">{campaign.description}</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600">Fundraising Progress</span>
              <span className="text-2xl font-bold text-indigo-600">{progress.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 h-4 rounded-full transition-all"
                style={{ width: `${Math.min(progress, 100)}%` }}></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Raised</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(campaign.total_donated / MIST_PER_SUI).toFixed(2)} <span className="text-sm text-gray-500">SUI</span>
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Goal</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(campaign.goal_amount / MIST_PER_SUI).toFixed(2)} <span className="text-sm text-gray-500">SUI</span>
                </p>
              </div>
            </div>
          </div>

          {campaign.active && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Make a Donation</h3>
              <div className="flex gap-4">
                <input
                  type="number" step="0.01" min="0.01" value={donationAmount}
                  onChange={(e) => setDonationAmount(e.target.value)}
                  placeholder="Enter amount in SUI"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button onClick={handleDonate} disabled={loading}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-lg font-bold hover:shadow-lg transition-all disabled:opacity-50">
                  {loading ? "Processing..." : "Donate"}
                </button>
              </div>
              <div className="flex gap-2 mt-3">
                {[1, 5, 10, 50].map((amount) => (
                  <button key={amount} onClick={() => setDonationAmount(amount.toString())}
                    className="px-4 py-2 bg-white rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">
                    {amount} SUI
                  </button>
                ))}
              </div>
            </div>
          )}

          {isCreator && campaign.active && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Creator Actions</h3>
              <p className="text-sm text-gray-600 mb-4">Withdrawing funds will close the campaign.</p>
              <button onClick={handleWithdraw} disabled={loading}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-bold transition-all disabled:opacity-50">
                {loading ? "Processing..." : "Withdraw Funds"}
              </button>
            </div>
          )}

          {!campaign.active && (
            <div className="bg-gray-100 rounded-xl p-6 text-center">
              <p className="text-gray-600 font-medium">This campaign is no longer accepting donations</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
