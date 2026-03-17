import { useState } from "react";
import Link from "next/link";
import { useCurrentAccount, useDisconnectWallet, ConnectModal } from "@mysten/dapp-kit";
import { useZkLogin } from "@/lib/zkLoginContext";
import { initiateZkLogin } from "@/lib/zkLogin";
import { useSuiClient } from "@mysten/dapp-kit";

export default function Navbar() {
  const account = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();
  const { zkAddress, logout: zkLogout } = useZkLogin();
  const suiClient = useSuiClient();
  const [open, setOpen] = useState(false);
  const [zkLoading, setZkLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setZkLoading(true);
    try {
      await initiateZkLogin(suiClient);
    } catch (err) {
      console.error("zkLogin error:", err);
      alert("Failed to initiate Google login. Make sure NEXT_PUBLIC_GOOGLE_CLIENT_ID is set.");
      setZkLoading(false);
    }
  };

  // Active address: prefer zkLogin, fall back to wallet
  const activeAddress = zkAddress ?? account?.address ?? null;

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

          <div className="flex items-center gap-3">
            {/* zkLogin session */}
            {zkAddress ? (
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-2 rounded-lg border border-green-200 flex items-center gap-2">
                  <span className="text-xs text-green-600 font-semibold">ZK</span>
                  <span className="text-sm font-mono text-gray-700">
                    {zkAddress.slice(0, 6)}...{zkAddress.slice(-4)}
                  </span>
                </div>
                <button
                  onClick={zkLogout}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-all text-sm"
                >
                  Sign Out
                </button>
              </div>
            ) : account ? (
              /* Regular wallet session */
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-2 rounded-lg border border-indigo-200">
                  <span className="text-sm font-mono text-gray-700">
                    {account.address.slice(0, 6)}...{account.address.slice(-4)}
                  </span>
                </div>
                <button
                  onClick={() => disconnect()}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-lg font-medium transition-all text-sm"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              /* Not connected — show both options */
              <div className="flex items-center gap-2">
                <button
                  onClick={handleGoogleLogin}
                  disabled={zkLoading}
                  className="flex items-center gap-2 bg-white border border-gray-300 hover:border-gray-400 text-gray-700 px-4 py-2.5 rounded-lg font-medium transition-all text-sm shadow-sm disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {zkLoading ? "Redirecting..." : "Sign in with Google"}
                </button>
                <ConnectModal
                  trigger={
                    <button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-5 py-2.5 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all text-sm">
                      Connect Wallet
                    </button>
                  }
                  open={open}
                  onOpenChange={setOpen}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
