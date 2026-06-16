# LAEL Luffa App Endless Mainnet Task Reward Report

日期：2026-06-16

## 结论

Luffa App QR / WebView bridge 已完成 Endless Mainnet `task_reward` 真实链上闭环。

本轮修复将 App bridge 交易流程从错误的“直接向 `packageTransactionV2` 传后端 BCS serialized transaction 并等待 txHash”改为 Luffa SuperBox 文档匹配的两步：

1. `packageTransactionV2` 接收 `data.data = JSON.stringify({ payload, secondarySignerAddresses, feePayer })`，返回 `rawData`。
2. `signAndSubmitTransaction` 接收 `serializedTransaction.data = rawData`，返回真实交易 hash。

## 真实执行证据

- QR session：`endless_qr_ada79865-c6b3-40cd-a9aa-4de5ed052dda`
- Authorization receipt：`endless_auth_c7419688-fefe-4dcb-8d92-3d5ae2ffd1cf`
- Chain：`ENDLESS_MAINNET`
- Business action：`task_reward`
- Amount：`0.001 EDS`
- Sender / wallet：`6XtEwYbTZ7PPNnFogtg6crSwXc8S8P53TqWEaSBassxw`
- Recipient / Alice：`6XtEwYbTZ7PPNnFogtg6crSwXc8S8P53TqWEaSBassxw`
- txHash：`D48oBNUHyigrBzpgWRvqyRyGpGNDXnsjKpht9hN9GGNL`
- `callbackSource`：`qr_scan_callback`
- `signatureVerified`：`true`
- `approvedWithoutTxHash`：`false`
- `evidenceDigest`：`c9ee8f0d372b3b2105ba17b01f5a8dde1ae1b5c703af73b7938472eee0876eb8`

## Bridge debug 证据

`packageTransactionV2` 请求 payload：

```json
{
  "data": "{\"payload\":{\"function\":\"0x1::endless_account::transfer\",\"functionArguments\":[\"6XtEwYbTZ7PPNnFogtg6crSwXc8S8P53TqWEaSBassxw\",\"100000\"],\"typeArguments\":[\"address\",\"u128\"],\"typeEnum\":[]},\"secondarySignerAddresses\":[],\"feePayer\":\"\"}"
}
```

`packageTransactionV2` 返回：

```json
{
  "status": "success",
  "data": {
    "rawData": "0x5233cbeb..."
  }
}
```

`signAndSubmitTransaction` 返回：

```json
{
  "status": "success",
  "data": {
    "hash": "D48oBNUHyigrBzpgWRvqyRyGpGNDXnsjKpht9hN9GGNL"
  }
}
```

## 链上 receipt 验证

`GET /v2/settlement/tx/D48oBNUHyigrBzpgWRvqyRyGpGNDXnsjKpht9hN9GGNL?chainType=endless&chainId=220`

返回摘要：

- `status=SUCCESS`
- `blockNumber=188157957`
- `success=true`
- `vm_status=Executed successfully`
- sender：`6XtEwYbTZ7PPNnFogtg6crSwXc8S8P53TqWEaSBassxw`
- payload function：`0x1::endless_account::transfer`
- payload amount：`100000` base units
- gas used：`8`

## LAEL 业务闭环

- Proposal：`proposal_bc49fc78-cf38-420d-8b84-9978a4331ede`
- Execution：`exec_e1dafda5-df76-4278-a3bf-f53571042c9f`
- Settlement：`settle_e770c575-657f-4772-a1b4-862798569c7e`
- Settlement status：`completed`
- Wallet type：`luffa`
- Execution mode：`app-authorized`
- App authorization status：`approved`
- Feedback：submitted，score `5`
- Learning：updated
- Agent score：`0.9556853094017375 -> 0.9601167784615637`
- Policy suggestion：`keep_human_confirmation`

## 验证命令

```bash
npm run typecheck
npm test -- tests/endless-qr.test.ts
npm run build
npm run health:luffa-app
```

以上命令均已在本轮修复后通过。

## 当前状态

P0 / P1 / P2 关键目标已完成：

- P0：Luffa App QR / WebView signed authorization 已验证。
- P1：Luffa App bridge 已返回真实 Endless Mainnet txHash，并通过链上 receipt 验证。
- P2：`Agent complete a small task and reward 0.001 EDS to Alice with Luffa App on Endless mainnet` 已形成 proposal -> human confirmation -> txHash -> receipt -> feedback -> learning 闭环。

