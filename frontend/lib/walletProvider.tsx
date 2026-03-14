import { ReactNode } from "react";
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { Network } from "@aptos-labs/ts-sdk";

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const network = process.env.NEXT_PUBLIC_APTOS_NETWORK === "mainnet"
    ? Network.MAINNET
    : Network.TESTNET;

  return (
    <AptosWalletAdapterProvider
      autoConnect={true}
      onError={(error) => {
        console.error("Wallet adapter error:", error);
      }}
      dappConfig={{
        network,
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}

export { useWallet } from "@aptos-labs/wallet-adapter-react";
