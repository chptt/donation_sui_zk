import Link from "next/link";
import { useWallet } from "@/lib/walletProvider";

export default function Navbar() {
  const { connect, disconnect, account, connected, wallets } = useWallet();

  const handleConnect = async () => {
    try {
      if (wallets && wallets.length > 0) {
        await connect(wallets[0].name);
      } else {
        await connect("Petra");
      }
    } catch (error: any) {
      console.error("Error connecting wallet:", error);
      
      // User-friendly error messages
      if (error.message?.includes("User rejected") || error.message?.includes("rejected")) {
        alert("❌ Connection rejected. Please approve the connection in your wallet.");
      } else if (error.message?.includes("locked")) {
        alert("❌ Wallet is locked. Please unlock it and try again.");
      } else if (error.message?.includes("not installed") || error.message?.includes("not found")) {
        alert("⚠️ Petra wallet not detected!\n\nPlease:\n1. Install Petra from petra.app\n2. Refresh this page\n3. Make sure Petra is unlocked");
        window.open("https://petra.app/", "_blank");
      } else {
        alert("❌ Failed to connect wallet. Please try again.");
      }
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-3xl">🤝</span>
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                DonateChain
              </span>
            </Link>
            <div className="hidden md:flex space-x-1">
              <Link href="/" className="text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg font-medium transition-all">
                Campaigns
              </Link>
              <Link href="/create" className="text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg font-medium transition-all">
                Create
              </Link>
              <Link href="/leaderboard" className="text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg font-medium transition-all">
                Leaderboard
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            {connected ? (
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-2 rounded-lg border border-indigo-200">
                  <span className="text-sm font-mono text-gray-700">
                    {account?.address?.toString().slice(0, 6)}...{account?.address?.toString().slice(-4)}
                  </span>
                </div>
                <button
                  onClick={handleDisconnect}
                  className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-lg font-medium transition-all"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleConnect}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-2.5 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
                >
                  Connect Wallet
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
