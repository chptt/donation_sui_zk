import { useState } from "react";
import { useRouter } from "next/router";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { PACKAGE_ID, MODULE_NAME, suiClient } from "@/lib/suiClient";
import { useZkLogin } from "@/lib/zkLoginContext";
import { getZkLoginSignature } from "@mysten/sui/zklogin";

const MIST_PER_SUI = 1_000_000_000;

export default function CreateCampaign() {
  const router = useRouter();
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const { zkSession, zkAddress } = useZkLogin();
  const activeAddress = zkAddress ?? account?.address ?? null;
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    charity_type: "Education",
    goal_amount: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAddress) { alert("Please connect your wallet or sign in with Google first"); return; }
    setLoading(true);
    try {
      const goalInMist = Math.floor(parseFloat(formData.goal_amount) * MIST_PER_SUI);
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::create_campaign`,
        arguments: [
          tx.pure.string(formData.title),
          tx.pure.string(formData.description),
          tx.pure.string(formData.charity_type),
          tx.pure.u64(goalInMist),
        ],
      });

      if (zkSession) {
        tx.setSender(zkSession.userAddress);
        const { bytes, signature: ephemeralSig } = await tx.sign({
          client: suiClient,
          signer: zkSession.ephemeralKeyPair,
        });
        if (!zkSession.zkProof) throw new Error("ZK proof not available. Please sign in again.");
        const zkSignature = getZkLoginSignature({
          inputs: { ...zkSession.zkProof, addressSeed: zkSession.salt },
          maxEpoch: zkSession.maxEpoch,
          userSignature: ephemeralSig,
        });
        await suiClient.executeTransactionBlock({
          transactionBlock: bytes,
          signature: zkSignature,
          options: { showEffects: true },
        });
      } else {
        await signAndExecute({ transaction: tx });
      }

      alert("Campaign created successfully!");
      router.push("/");
    } catch (error) {
      console.error("Error creating campaign:", error);
      alert("Failed to create campaign. Please try again.");
    }
    setLoading(false);
  };

  const charityOptions = [
    { value: "Education", icon: "📚", label: "Education" },
    { value: "Healthcare", icon: "🏥", label: "Healthcare" },
    { value: "Food", icon: "🍽️", label: "Food & Hunger" },
    { value: "Environment", icon: "🌍", label: "Environment" },
  ];

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Create Your Campaign</h1>
          <p className="text-lg text-gray-600">Launch your charity campaign on the Sui blockchain</p>
        </div>
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-10 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Campaign Title</label>
              <input
                type="text" required value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900"
                placeholder="e.g., Help Build a School in Rural Area"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Campaign Description</label>
              <textarea
                required value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={5}
                className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900 resize-none"
                placeholder="Describe your campaign and the impact it will make..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Campaign Category</label>
              <div className="grid grid-cols-2 gap-4">
                {charityOptions.map((option) => (
                  <button key={option.value} type="button"
                    onClick={() => setFormData({ ...formData, charity_type: option.value })}
                    className={`p-5 rounded-xl border-2 transition-all ${
                      formData.charity_type === option.value
                        ? "border-indigo-600 bg-indigo-50 shadow-md"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div className="text-4xl mb-2">{option.icon}</div>
                    <div className={`font-semibold ${formData.charity_type === option.value ? "text-indigo-600" : "text-gray-700"}`}>
                      {option.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Fundraising Goal (SUI)</label>
              <div className="relative">
                <input
                  type="number" required step="0.01" min="0.01" value={formData.goal_amount}
                  onChange={(e) => setFormData({ ...formData, goal_amount: e.target.value })}
                  className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900 pr-16"
                  placeholder="100"
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 font-medium">SUI</span>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-5 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Campaign...
                </span>
              ) : "Create Campaign"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
