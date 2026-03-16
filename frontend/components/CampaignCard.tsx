import Link from "next/link";
import { Campaign } from "@/lib/suiClient";

const charityIcons: { [key: string]: string } = {
  Education: "📚",
  Healthcare: "🏥",
  Food: "🍽️",
  Environment: "🌍",
};

// SUI uses MIST (1 SUI = 1_000_000_000 MIST)
const MIST_PER_SUI = 1_000_000_000;

interface CampaignCardProps {
  campaign: Campaign;
}

export default function CampaignCard({ campaign }: CampaignCardProps) {
  const progress = campaign.goal_amount > 0
    ? (campaign.total_donated / campaign.goal_amount) * 100
    : 0;

  return (
    <Link href={`/campaign/${campaign.id}`}>
      <div className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-indigo-200 cursor-pointer transform hover:-translate-y-1">
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 relative">
          <div className="flex items-start justify-between">
            <div className="text-5xl">{charityIcons[campaign.charity_type] || "💝"}</div>
            <span className={`px-4 py-1.5 rounded-full text-xs font-semibold ${
              campaign.active
                ? "bg-green-100 text-green-700 border border-green-200"
                : "bg-gray-100 text-gray-600 border border-gray-200"
            }`}>
              {campaign.active ? "● Active" : "Closed"}
            </span>
          </div>
        </div>

        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-1">
            {campaign.title}
          </h3>
          <p className="text-gray-600 text-sm mb-5 line-clamp-2 leading-relaxed">
            {campaign.description}
          </p>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Progress</span>
              <span className="text-sm font-bold text-indigo-600">{progress.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.min(progress, 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-500 mb-1">Raised</p>
              <p className="text-lg font-bold text-gray-900">
                {(campaign.total_donated / MIST_PER_SUI).toFixed(2)} <span className="text-sm text-gray-500">SUI</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-1">Goal</p>
              <p className="text-lg font-bold text-gray-900">
                {(campaign.goal_amount / MIST_PER_SUI).toFixed(2)} <span className="text-sm text-gray-500">SUI</span>
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-center py-3 rounded-xl font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            View Campaign →
          </div>
        </div>
      </div>
    </Link>
  );
}
