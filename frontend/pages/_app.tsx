import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Navbar from "@/components/Navbar";
import { WalletProvider } from "@/lib/walletProvider";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WalletProvider>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Component {...pageProps} />
      </div>
    </WalletProvider>
  );
}
