import { useState, useEffect } from "react";
import CampaignCard from "@/components/CampaignCard";
import { getCampaigns, Campaign } from "@/lib/aptosClient";

export default function Home() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const data = await getCampaigns();
      setCampaigns(data);
    } catch (error) {
      console.error("Error loading campaigns:", error);
    }
    setLoading(false);
  };

  const filteredCampaigns = filter === "All" 
    ? campaigns 
    : campaigns.filter(c => c.charity_type === filter);

  const categories = ["All", "Education", "Healthcare", "Food", "Environment"];

  const totalRaised = campaigns.reduce((sum, c) => sum + c.total_donated, 0);
  const activeCampaigns = campaigns.filter(c => c.active).length;

  return (
    <main>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Donate with Transparency
            </h1>
            <p className="text-xl md:text-2xl text-indigo-100 max-w-3xl mx-auto">
              Support meaningful causes through blockchain-powered campaigns. Every donation is tracked, transparent, and directly impacts the communities that need it most.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-center">
              <div className="text-4xl font-bold mb-2">{campaigns.length}</div>
              <div className="text-indigo-100">Total Campaigns</div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-center">
              <div className="text-4xl font-bold mb-2">{(totalRaised / 100000000).toFixed(2)}</div>
              <div className="text-indigo-100">APT Raised</div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-center">
              <div className="text-4xl font-bold mb-2">{activeCampaigns}</div>
              <div className="text-indigo-100">Active Campaigns</div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-center">
              <div className="text-4xl font-bold mb-2">1000+</div>
              <div className="text-indigo-100">Donors</div>
            </div>
          </div>
        </div>
      </section>

      {/* Campaigns Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Active Campaigns</h2>
          <p className="text-xl text-gray-600">Support these amazing causes and make a real difference</p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-6 py-3 rounded-full font-medium transition-all ${
                filter === cat
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent"></div>
            <p className="mt-6 text-gray-600 text-lg">Loading campaigns...</p>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-3xl">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-2xl font-semibold text-gray-900 mb-2">No campaigns found</p>
            <p className="text-gray-600 mb-6">Be the first to create a campaign and make a difference!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCampaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
