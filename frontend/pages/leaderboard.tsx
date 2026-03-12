import { useState, useEffect } from "react";
import { getDonations, Donation } from "@/lib/aptosClient";

interface DonorStats {
  address: string;
  totalDonated: number;
  donationCount: number;
}

export default function Leaderboard() {
  const [donors, setDonors] = useState<DonorStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const donations = await getDonations();
      
      const donorMap = new Map<string, DonorStats>();
      
      donations.forEach((donation: Donation) => {
        const existing = donorMap.get(donation.donor);
        if (existing) {
          existing.totalDonated += donation.amount;
          existing.donationCount += 1;
        } else {
          donorMap.set(donation.donor, {
            address: donation.donor,
            totalDonated: donation.amount,
            donationCount: 1,
          });
        }
      });
      
      const sortedDonors = Array.from(donorMap.values())
        .sort((a, b) => b.totalDonated - a.totalDonated);
      
      setDonors(sortedDonors);
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
        <p className="text-xl text-gray-600">
          Celebrating our most generous supporters
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
              <thead className="bg-gradient-to-r from-primary to-secondary text-white">
                <tr>
                  <th className="px-6 py-4 text-left">Rank</th>
                  <th className="px-6 py-4 text-left">Donor Address</th>
                  <th className="px-6 py-4 text-right">Total Donated</th>
                  <th className="px-6 py-4 text-right">Donations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {donors.map((donor, index) => (
                  <tr
                    key={donor.address}
                    className={`hover:bg-gray-50 transition-colors ${
                      index < 3 ? "bg-yellow-50" : ""
                    }`}
                  >
                    <td className="px-6 py-4">
                      <span className="text-2xl font-bold">{getMedalEmoji(index)}</span>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm">
                      {donor.address.slice(0, 8)}...{donor.address.slice(-6)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-primary text-lg">
                        {(donor.totalDonated / 100000000).toFixed(2)} APT
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
