import { ReactNode } from "react";
import { SuiClientProvider, WalletProvider as DappKitWalletProvider } from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ZkLoginProvider } from "./zkLoginContext";

const queryClient = new QueryClient();

const network = (process.env.NEXT_PUBLIC_SUI_NETWORK as "mainnet" | "testnet" | "devnet") || "testnet";

const networks = {
  mainnet: { url: getFullnodeUrl("mainnet") },
  testnet: { url: getFullnodeUrl("testnet") },
  devnet: { url: getFullnodeUrl("devnet") },
};

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networks} defaultNetwork={network}>
        <DappKitWalletProvider
          autoConnect
          preferredWallets={["Slush", "Sui Wallet", "Suiet"]}
          stashedWallet={{ name: "DonateChain" }}
        >
          <ZkLoginProvider>{children}</ZkLoginProvider>
        </DappKitWalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
