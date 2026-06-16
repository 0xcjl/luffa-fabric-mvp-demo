"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { clusterApiUrl } from "@solana/web3.js";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { WagmiProvider, createConfig, http, injected } from "wagmi";
import { base, baseSepolia, bsc, bscTestnet, mainnet, polygonAmoy, sepolia } from "wagmi/chains";

const evmChains = [baseSepolia, bscTestnet, bsc, base, sepolia, polygonAmoy, mainnet] as const;
const evmConnectors = [injected()];

const config = createConfig({
  chains: evmChains,
  connectors: evmConnectors,
  transports: {
    [baseSepolia.id]: http(),
    [bscTestnet.id]: http(),
    [bsc.id]: http(),
    [base.id]: http(),
    [sepolia.id]: http(),
    [polygonAmoy.id]: http(),
    [mainnet.id]: http()
  },
  ssr: true
});

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const endpoint = clusterApiUrl(WalletAdapterNetwork.Devnet);
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectionProvider endpoint={endpoint}>
          <WalletProvider wallets={wallets} autoConnect={false} onError={() => undefined}>
            <WalletModalProvider>{children}</WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
