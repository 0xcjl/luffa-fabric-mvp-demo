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
import type { EIP1193Provider } from "viem";

const evmChains = [baseSepolia, bscTestnet, bsc, base, sepolia, polygonAmoy, mainnet] as const;

type BrowserWalletProvider = EIP1193Provider & {
  isMetaMask?: true;
  isOkxWallet?: true;
  isOKExWallet?: true;
  isRabby?: true;
  isPhantom?: true;
};

type WalletWindow = Window &
  typeof globalThis & {
    ethereum?: BrowserWalletProvider & { providers?: BrowserWalletProvider[] };
    okxwallet?: BrowserWalletProvider;
    phantom?: { ethereum?: BrowserWalletProvider };
  };

function injectedProviders(window?: unknown): BrowserWalletProvider[] {
  const walletWindow = window as WalletWindow | undefined;
  const providers = walletWindow?.ethereum?.providers ?? [];
  return [walletWindow?.okxwallet, walletWindow?.phantom?.ethereum, ...providers, walletWindow?.ethereum].filter(Boolean) as BrowserWalletProvider[];
}

function findInjectedProvider(window: unknown, predicate: (provider: BrowserWalletProvider) => boolean): BrowserWalletProvider | undefined {
  return injectedProviders(window).find((provider) => predicate(provider));
}

const evmConnectors = [
  injected({
    target: () => ({
      id: "okx",
      name: "OKX Wallet",
      provider: (window) => findInjectedProvider(window, (provider) => Boolean(provider.isOkxWallet || provider.isOKExWallet)),
    }),
  }),
  injected({ target: "metaMask" }),
  injected({
    target: () => ({
      id: "rabby",
      name: "Rabby",
      provider: (window) => findInjectedProvider(window, (provider) => Boolean(provider.isRabby)),
    }),
  }),
  injected({ target: "phantom" }),
  injected({
    target: () => ({
      id: "injected",
      name: "Injected Wallet",
      provider: (window) => (window as WalletWindow | undefined)?.ethereum,
    }),
  }),
];

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
