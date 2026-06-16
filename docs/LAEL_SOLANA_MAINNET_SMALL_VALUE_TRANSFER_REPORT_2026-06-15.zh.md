# LAEL Solana Mainnet Small-value Transfer Report

日期：2026-06-15

## 结论

Solana Mainnet 小额真实链上自转已完成，并已进入 LAEL receipt、feedback 和 learning。

- Network: `SOLANA_MAINNET`
- Wallet / recipient: `CDP7oDAHNKPRuEFo5VqhrtSyhQwWiEScj91hyepJAiSC`
- Amount: `0.000001 SOL`
- Signature: `4YLEVpKSGd3wCLApqgPsVHx9nCjbG6Cavcb1cqmj23JyXHZi84CwLKFGShpQR84p8BiviwJFFNU5GRx2UyHhqK16`
- Explorer: `https://explorer.solana.com/tx/4YLEVpKSGd3wCLApqgPsVHx9nCjbG6Cavcb1cqmj23JyXHZi84CwLKFGShpQR84p8BiviwJFFNU5GRx2UyHhqK16`
- Public RPC status: `finalized`, `err=null`, `slot=426702421`
- Transfer instruction: `source=destination=CDP7oDAHNKPRuEFo5VqhrtSyhQwWiEScj91hyepJAiSC`, `lamports=1000`
- LAEL execution: `exec_19f2155b-521b-48b6-8816-6b834494835c`
- LAEL settlement: `settle_bca3bdaf-d7fa-458a-b31a-5f26023414b6`
- Feedback / learning: submitted; learning kept human confirmation for mainnet actions.

## 修复点

- 前端 Solana 发送路径不再使用固定 devnet provider；按所选链创建 Solana RPC connection。
- Solana Mainnet browser RPC 改用 `https://solana-rpc.publicnode.com`，避免官方 endpoint 在浏览器侧返回 `403`.
- Solana 交易在 `confirmTransaction` 成功后才写入 txHash。
- Mainnet guard 文案从 Base-only 改为当前链通用文案。
- `SOLANA_MAINNET` registry 增加 public RPC fallback。
- Solana settlement adapter 增加 `searchTransactionHistory: true`，确保 finalized 历史交易可验证。

## 验证

- `npm run typecheck`
- `npm run build`
- `npm run build` in `src/frontend`
- `npm test -- tests/settlement-adapters.test.ts tests/mvp2-payment-agent.test.ts tests/value-agent.test.ts`
- Public Solana RPC confirmed `status=finalized`, `err=null`, `slot=426702421`.
- LAEL `/v2/settlement/tx/:signature?chainType=solana&chainId=mainnet-beta` returned `SUCCESS`, `blockNumber=426702421`.

## 边界

此前页面曾把未自动回填 txHash 的 Solana 操作记录为 mock receipt；该 UI mock receipt 不计入真实链上完成。本报告只使用上方 public RPC 和 LAEL API 重新记录的真实 signature 作为完成证据。
