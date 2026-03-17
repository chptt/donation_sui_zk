import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { handleZkLoginCallback } from "@/lib/zkLogin";
import { useZkLogin } from "@/lib/zkLoginContext";
import { suiClient } from "@/lib/suiClient";

export default function ZkLoginCallback() {
  const router = useRouter();
  const { setZkSession } = useZkLogin();
  const [status, setStatus] = useState<"loading" | "no_gas" | "done" | "error">("loading");
  const [address, setAddress] = useState("");

  useEffect(() => {
    async function process() {
      try {
        const session = await handleZkLoginCallback();
        if (!session) {
          setStatus("error");
          return;
        }

        // Set session in context BEFORE any navigation so keypair stays in memory
        setZkSession(session);
        setAddress(session.userAddress);

        // Check gas
        const coins = await suiClient.getCoins({
          owner: session.userAddress,
          coinType: "0x2::sui::SUI",
        });

        if (coins.data.length === 0) {
          setStatus("no_gas");
        } else {
          setStatus("done");
          // Use router.push (soft nav) to keep the React tree alive and preserve keypair in memory
          router.push("/");
        }
      } catch (err) {
        console.error("zkLogin callback error:", err);
        setStatus("error");
      }
    }
    process();
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mb-4"></div>
          <p className="text-lg text-gray-700">Completing sign in...</p>
        </div>
      </div>
    );
  }

  if (status === "no_gas") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">⛽</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Fund Your Wallet</h2>
          <p className="text-gray-600 mb-4">
            Your zkLogin address has no SUI for gas. Request testnet tokens from the faucet to continue.
          </p>
          <div className="bg-gray-100 rounded-lg px-4 py-3 mb-6 font-mono text-sm text-gray-700 break-all">
            {address}
          </div>
          <div className="flex flex-col gap-3">
            <a
              href={`https://faucet.sui.io/?address=${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-all"
            >
              Get Testnet SUI from Faucet
            </a>
            <button
              onClick={() => router.push("/")}
              className="text-gray-500 hover:text-gray-700 text-sm underline"
            >
              Continue anyway
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-5xl mb-4">❌</div>
          <p className="text-lg text-gray-700 mb-4">Login failed. Please try again.</p>
          <button
            onClick={() => router.push("/")}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="text-5xl mb-4">✅</div>
        <p className="text-lg text-gray-700">Signed in! Redirecting...</p>
      </div>
    </div>
  );
}
