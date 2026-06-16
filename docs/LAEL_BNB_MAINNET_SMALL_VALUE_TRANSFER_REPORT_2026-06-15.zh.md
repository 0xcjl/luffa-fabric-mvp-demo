# LAEL BNB Mainnet 小额真实转账验证报告

日期：2026-06-15  
仓库：`/Users/xyz/Documents/luffa-fabric`  
分支：`codex/varr-api-route-fixes`

## 结论

BNB Mainnet 小额真实价值闭环已完成：

```text
proposal -> human wallet confirmation -> real txHash -> public RPC receipt -> LAEL receipt -> feedback -> learning
```

本次执行为当前 OKX/EVM 钱包自转：

- Chain：`BNB_MAINNET`
- Amount：`0.000001 BNB`
- From：`0xC32428B4B31873F41E6a6b81028080469E2d4492`
- To：`0xC32428B4B31873F41E6a6b81028080469E2d4492`
- txHash：`0x0985baaf632a8f8a6c9b474c78dfc71935029d6e6007ddf27e2f7b207acb9736`
- Explorer：`https://bscscan.com/tx/0x0985baaf632a8f8a6c9b474c78dfc71935029d6e6007ddf27e2f7b207acb9736`
- LAEL execution：`exec_3a85ba42-f526-4c40-a628-53b52e9460fc`
- LAEL settlement：`settle_4607ced7-d095-4df3-833e-90561dc871eb`
- LAEL receipt status：`completed`
- Feedback：submitted
- Learning：updated

## 前置安全门

- API 启动参数包含 `LAEL_ENABLE_MAINNET_EXECUTION=true`
- `LAEL_MAINNET_MAX_AMOUNT_ETH=0.001`
- 前端主网风险确认已勾选
- 实际金额 `0.000001 BNB` 小于主网上限
- 用户明确确认从测试网切换为主网测试，并确认 `BNB Mainnet 0.000001` 自转路径

## 本轮修复

执行前发现 payment-agent 的 BNB 主网自然语言解析会被 `bnb` 关键字优先解析为 `BNB_TESTNET`，导致 proposal 被 `Chain denied by permission policy` 阻断。

已修复：

- `src/payment-agent/index.ts`：`parseExplicitChain()` 先识别 `BNB mainnet`、`Base mainnet`、`Solana mainnet`，再回退到测试网默认。
- `src/value-agent/index.ts`：`parseChain()` 同步修复 BNB/Base/Solana/Endless mainnet 的解析优先级。
- `tests/mvp2-payment-agent.test.ts`：新增 BNB Mainnet transfer 解析回归测试。
- `tests/value-agent.test.ts`：新增 BNB Mainnet swap 解析回归测试。

## 验证证据

自动化验证：

- `npm test -- tests/mvp2-payment-agent.test.ts tests/value-agent.test.ts`
  - 2 files / 12 tests 通过
- `npm run typecheck`
  - 通过
- `npm run build`
  - 通过

API proposal 验证：

```json
{
  "status": "allow_pending_human_confirmation",
  "reason": "Within policy; explicit wallet confirmation required",
  "chain": "BNB_MAINNET",
  "amount": 0.000001,
  "asset": "BNB"
}
```

公共 BSC 主网 RPC receipt 验证：

```json
{
  "transactionHash": "0x0985baaf632a8f8a6c9b474c78dfc71935029d6e6007ddf27e2f7b207acb9736",
  "from": "0xc32428b4b31873f41e6a6b81028080469e2d4492",
  "to": "0xc32428b4b31873f41e6a6b81028080469e2d4492",
  "status": "0x1",
  "gasUsed": "0x5208",
  "blockNumber": "0x639787d"
}
```

LAEL 前端回执验证：

- `Execution Loop Console` 显示 `Evidence generated`
- Receipt 显示 `BNB_MAINNET / evm`
- Mode：`real`
- App auth：`approved`
- Settlement：`completed`
- Feedback：`Feedback submitted`
- Learning：`updated`
- Agent score：`0.94 -> 0.95`

## 边界

- 这是 BNB Mainnet 真实小额自转，不是 BNB Testnet。
- 本次 txHash 是真实主网交易；测试网 faucet 领取仍未完成。
- 主网真实价值执行仍必须保留 env gate、页面风险确认和金额上限。
- Learning 更新仅用于偏好记忆和策略建议，不自动提高额度、不新增收款人、不绕过人工确认、不自动导出训练数据。
