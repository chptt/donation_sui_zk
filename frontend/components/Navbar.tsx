import Link from "next/link";
import { useCurrentAccount, useConnectWallet, useDisconnectWallet, useWallets } from "@/lib/walletProvider";

export default function Navbar() {
  const account = useCurrentAccount();
  const { mutate: connect } = useConnectWallet();
  const { mutate: disconnect } = useDisconnectWallet();
  const wallets = useWallets();

  const handleConnect = () => {
    if (wallets.length > 0) {
      connect({ wallet: wallets[0] });
    } else {
      alert("No Sui wallet detected. Please install Sui Wallet or Suiet and refresh.");
      window.open("https://suiwallet.com/", "_blank");
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
            {account ? (
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-2 rounded-lg border border-indigo-200">
                  <span className="text-sm font-mono text-gray-700">
                    {account.address.slice(0, 6)}...{account.address.slice(-4)}
                  </span>
                </div>
                <button
                  onClick={() => disconnect()}
                  className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-lg font-medium transition-all"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnect}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-2.5 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
