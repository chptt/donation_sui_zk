import { useState, useEffect } from "react";
import { getDonorStats, DonorStats } from "@/lib/suiClient";

const MIST_PER_SUI = 1_000_000_000;

export default function Leaderboard() {
  const [donors, setDonors] = useState<DonorStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadLeaderboard(); }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await getDonorStats();
      setDonors(data);
    } catch (error) {
      console.error("Error loading leaderboard:", error);
    }
    setLoading(false);
  };

  const getMedalEmoji = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `#${index + 1}`;
  };

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">🏆 Top Donors</h1>
        <p className="text-xl text-gray-600">Celebrating our most generous supporters</p>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading leaderboard...</p>
        </div>
      ) : donors.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-xl text-gray-600">No donations yet. Be the first to donate!</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left">Rank</th>
                  <th className="px-6 py-4 text-left">Donor Address</th>
                  <th className="px-6 py-4 text-right">Total Donated</th>
                  <th className="px-6 py-4 text-right">Donations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {donors.map((donor, index) => (
                  <tr key={donor.address} className={`hover:bg-gray-50 transition-colors ${index < 3 ? "bg-yellow-50" : ""}`}>
                    <td className="px-6 py-4">
                      <span className="text-2xl font-bold">{getMedalEmoji(index)}</span>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm">
                      {donor.address.slice(0, 8)}...{donor.address.slice(-6)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-indigo-600 text-lg">
                        {(donor.totalDonated / MIST_PER_SUI).toFixed(2)} SUI
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="bg-gray-100 px-3 py-1 rounded-full text-sm font-medium">
                        {donor.donationCount}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
