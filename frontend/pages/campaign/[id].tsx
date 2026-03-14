import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { getCampaigns, Campaign, CONTRACT_ADDRESS, MODULE_NAME } from "@/lib/aptosClient";

export default function CampaignDetails() {
  const router = useRouter();
  const { id } = router.query;
  const { signAndSubmitTransaction, account, connected } = useWallet();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [donationAmount, setDonationAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadCampaign();
    }
  }, [id]);

  const loadCampaign = async () => {
    setPageLoading(true);
    setError(null);
    try {
      const campaigns = await getCampaigns();
      const found = campaigns.find((c) => c.id === parseInt(id as string));
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

    setLoading(true);
    try {
      if (!connected || !account) {
        alert("Please connect your wallet first");
        setLoading(false);
        return;
      }

      const amountInOctas = parseFloat(donationAmount) * 100000000;

      const payload: any = {
        data: {
          function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::donate_to_campaign`,
          functionArguments: [campaign!.id.toString(), amountInOctas.toString(), CONTRACT_ADDRESS],
        },
      };

      await signAndSubmitTransaction(payload);
      alert("Donation successful! Thank you for your support!");
      setDonationAmount("");
      loadCampaign();
    } catch (error) {
      console.error("Error donating:", error);
      alert("Failed to donate. Please try again.");
    }
    setLoading(false);
  };

  if (pageLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="mt-4 text-gray-600">Loading campaign...</p>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4">😕</div>
        <p className="text-xl font-semibold text-gray-900 mb-2">{error || "Campaign not found"}</p>
        <button
          onClick={() => router.push("/")}
          className="mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
        >
          Back to Campaigns
        </button>
      </div>
    );
  }

  const progress = campaign.goal_amount > 0 
    ? (campaign.total_donated / campaign.goal_amount) * 100 
    : 0;

  const charityIcons: { [key: string]: string } = {
    Education: "📚",
    Healthcare: "🏥",
    Food: "🍽️",
    Environment: "🌍",
  };

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-secondary p-8 text-white">
          <div className="text-6xl mb-4">{charityIcons[campaign.charity_type] || "💝"}</div>
          <h1 className="text-4xl font-bold mb-2">{campaign.title}</h1>
          <p className="text-blue-100">Campaign #{campaign.id}</p>
        </div>

        <div className="p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Campaign</h2>
            <p className="text-gray-700 leading-relaxed">{campaign.description}</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600">Fundraising Progress</span>
              <span className="text-2xl font-bold text-primary">{progress.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
              <div
                className="bg-gradient-to-r from-primary to-secondary h-4 rounded-full transition-all"
                style={{ width: `${Math.min(progress, 100)}%` }}
              ></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Raised</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(campaign.total_donated / 100000000).toFixed(2)} APT
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Goal</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(campaign.goal_amount / 100000000).toFixed(2)} APT
                </p>
              </div>
            </div>
          </div>

          {campaign.active && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Make a Donation</h3>
              <div className="flex gap-4">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(e.target.value)}
                  placeholder="Enter amount in APT"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <button
                  onClick={handleDonate}
                  disabled={loading}
                  className="bg-gradient-to-r from-primary to-secondary text-white px-8 py-3 rounded-lg font-bold hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {loading ? "Processing..." : "Donate"}
                </button>
              </div>
              <div className="flex gap-2 mt-3">
                {[1, 5, 10, 50].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setDonationAmount(amount.toString())}
                    className="px-4 py-2 bg-white rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    {amount} APT
                  </button>
                ))}
              </div>
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
