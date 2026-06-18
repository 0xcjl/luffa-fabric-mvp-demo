# Luffa Fabric MVP Wallet Test Guide

Completed by **Luffa AI Research Lab**.

This guide describes the current public demo wallet paths. It is not a production wallet integration guide.

## Supported wallet paths

### EVM chains: Base / BNB

EVM wallet priority:

```text
OKX Wallet -> MetaMask -> Rabby -> Phantom -> generic injected
```

Use OKX Wallet first when it is installed and available. Fallback wallets are only used when the higher-priority provider is unavailable or rejected.

### Solana

Solana wallet priority:

```text
Phantom -> OKX Solana -> Solana wallet selector
```

Phantom remains the preferred Solana provider. OKX Solana is used only when the extension exposes a Solana-compatible provider that can connect and sign the transaction.

### Endless

Endless paths:

```text
Use Endless Web Wallet
Use Luffa App
```

Endless Web Wallet is the browser SDK signing path. `Use Luffa App` is a separate QR / WebView path for native app login, authorization, and transaction validation; it requires a fresh public Render callback QR and must not be treated as a silent fallback for a blank Web Wallet window.

### Not part of the MVP demo path

WalletConnect / Project ID is not used as an MVP capability display path in this demo.

## Binding flow

1. Connect a wallet in the frontend.
2. The frontend calls `POST /v2/wallet/connect` with `ownerRef`, `walletType`, `chainType`, and `address`.
3. Luffa Fabric returns a nonce and canonical binding message.
4. The wallet signs that message.
5. The frontend calls `POST /v2/wallet/verify`.
6. Luffa Fabric verifies the signature and records a DID-to-wallet binding.

Luffa Fabric never accepts a mnemonic, seed phrase, master private key, or wallet credential.

## Transaction test flow

1. Select the target chain.
2. Connect the preferred wallet for that chain.
3. Generate a small transfer or task reward proposal.
4. Confirm the proposal requires human confirmation.
5. For mainnet, accept the explicit risk checkbox only for controlled small-value testing.
6. Click `Sign Wallet Tx` or `Sign Endless Web Wallet Tx`.
7. Confirm manually in the wallet.
8. Require a real txHash before recording real chain completion.
9. Confirm receipt, settlement evidence, feedback, and learning state.

After a real txHash is returned, the frontend records the receipt automatically. `Approve & Record` is only for manual txHash entry or retrying a failed receipt record.

## Completion boundary

Real chain completion requires:

- manual wallet confirmation
- real txHash
- recorded receipt
- settlement / evidence linked to the txHash

The following are not real chain completion:

- empty txHash
- `mock_` txHash
- signed-only authorization
- protocol-only QR approval
- App authorization without txHash

## Public demo note

Public testers can use the Vercel frontend directly. They do not need local deployment unless they are running localhost-only QA, changing code, or debugging the API / frontend locally.
