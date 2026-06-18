import { describe, expect, it } from "vitest";
import {
  projectDocsIndex,
  projectDocsMaintenanceRule,
  projectDocsSections,
  projectDocsStatus,
} from "../src/frontend/app/project-docs-data.js";

describe("frontend Project Docs data", () => {
  it("keeps all required Project Docs sections visible", () => {
    const titles = projectDocsSections.map((section) => section.title);

    expect(titles).toEqual([
      "项目介绍",
      "设计思路",
      "系统架构",
      "运行流程",
      "模块说明",
      "操作步骤",
      "注意事项",
      "文档与测试报告索引",
    ]);
  });

  it("states the current version and the maintenance rule", () => {
    const statusText = projectDocsStatus.map((item) => `${item.label}: ${item.value}`).join("\n");

    expect(statusText).toContain("LAEL / Luffa Fabric MVP v0.3");
    expect(statusText).toContain("Unified Agent Runtime Fabric");
    expect(statusText).toContain("Off-chain Runtime + Multi-chain Value + Endless Web Wallet + Luffa App Authorization + Task Reward");
    expect(statusText).toContain("2026-06-15");
    expect(projectDocsMaintenanceRule).toBe("后续所有文档变更必须同步到 Project Docs");
  });

  it("explains LAEL positioning, loop model, and AGT boundary", () => {
    const content = projectDocsSections
      .flatMap((section) => [section.title, section.summary, ...section.items])
      .join("\n");

    expect(content).toContain("Verifiable Adaptive Resource Runtime");
    expect(content).toContain("不是 chatbot、workflow builder、MCP wrapper、agent marketplace");
    expect(content).toContain("Identity -> Permission -> Execution -> Settlement -> Evidence -> Feedback -> Learning");
    expect(content).toContain("Microsoft AGT 是 Permission / Governance Extension 的可选治理积木");
    expect(content).toContain("AGT 不替代 Luffa DID、wallet signing、settlement");
    expect(content).toContain("Base、BNB、Solana、Endless Web Wallet / Luffa App");
    expect(content).toContain("Endless 浏览器真实链上执行优先通过官方 Endless Web Wallet SDK");
    expect(content).toContain("App bridge payload 兼容问题");
    expect(content).toContain("主网真实执行需要 env gate");
    expect(content).toContain("Full MVP testing");
    expect(content).toContain("MVP 验收矩阵记录 2026-06-15");
    expect(content).toContain("Wallet Integration Demo Script");
    expect(content).toContain("Real-environment Test Report");
    expect(content).toContain("Internal Technical One-pager");
    expect(content).toContain("Endless QR / WebView authorization");
    expect(content).toContain("Luffa App 独立二维码授权已升级为 luffa-endless-auth:v1");
    expect(content).toContain("luffa-endless-auth:v1");
    expect(content).toContain("signature verified");
    expect(content).toContain("Task Reward");
    expect(content).toContain("businessAction=task_reward");
    expect(content).toContain("LAEL_PUBLIC_CALLBACK_BASE_URL");
    expect(content).toContain("公网可访问 HTTPS tunnel");
    expect(content).toContain("Cloudflare 1033/530");
    expect(content).toContain("旧 QR 作废");
    expect(content).toContain("businessAction=login");
    expect(content).toContain("登录签名不得夹带转账 intent");
    expect(content).toContain("asset=EDS");
    expect(content).toContain("P0-P2 Comprehensive Test Summary");
    expect(content).toContain("P2 Task Reward 业务闭环");
    expect(content).toContain("Full Regression QA Report");
    expect(content).toContain(".next-live");
    expect(content).toContain(".next-build");
    expect(content).toContain("Wallet Stability Fix Report");
    expect(content).toContain("Solana Mainnet transfer");
    expect(content).toContain("余额 + fee 预检");
    expect(content).toContain("198.18.*");
    expect(content).toContain("Use Luffa App");
    expect(content).toContain("Retry Record");
    expect(content).toContain("stale receipt / idempotency");
    expect(content).toContain("Public Demo Iteration/Test Report");
  });

  it("indexes the key docs and test reports shown in the frontend", () => {
    const indexText = projectDocsIndex.map((item) => `${item.file}: ${item.note}`).join("\n");

    expect(indexText).toContain("NEXT_SESSION_HANDOFF.md");
    expect(indexText).toContain("LAEL_REQUIREMENTS_v0.3.zh.md");
    expect(indexText).toContain("LAEL_MVP_v0.3.zh.md");
    expect(indexText).toContain("LAEL_TEST_PLAN_v0.3.zh.md");
    expect(indexText).toContain("LAEL_DOCS_TIMELINE_v0.3.zh.md");
    expect(indexText).toContain("LAEL_AGT_INTEGRATION_v0.3.zh.md");
    expect(indexText).toContain("LAEL_AGT_NEXT_STEP_EVALUATION_2026-06-02.zh.md");
    expect(indexText).toContain("LAEL_AGT_IMPLEMENTATION_PLAN_2026-06-02.zh.md");
    expect(indexText).toContain("LAEL_AGT_BROWSER_ACCEPTANCE_REPORT_2026-06-02.zh.md");
    expect(indexText).toContain("LAEL_MULTICHAIN_WALLET_SUPPORT_TEST_REPORT_2026-06-02.zh.md");
    expect(indexText).toContain("LAEL_BASE_SEPOLIA_ACCEPTANCE_REPORT_2026-06-04.zh.md");
    expect(indexText).toContain("LAEL_MVP_ACCEPTANCE_MATRIX_2026-06-04.zh.md");
    expect(indexText).toContain("LAEL_WALLET_INTEGRATION_DEMO_SCRIPT_2026-06-04.zh.md");
    expect(indexText).toContain("LAEL_REAL_ENVIRONMENT_TEST_REPORT_2026-06-04.zh.md");
    expect(indexText).toContain("LAEL_INTERNAL_TECHNICAL_ONE_PAGER_2026-06-06.zh.md");
    expect(indexText).toContain("LAEL_P0_P1_P2_NATIVE_APP_REWARD_VERIFICATION_REPORT_2026-06-12.zh.md");
    expect(indexText).toContain("LAEL_ENDLESS_WEB_WALLET_SESSION_REPORT_2026-06-15.zh.md");
    expect(indexText).toContain("LAEL_LUFFA_APP_ENDLESS_MAINNET_TASK_REWARD_REPORT_2026-06-16.zh.md");
    expect(indexText).toContain("LAEL_P0_P2_COMPREHENSIVE_TEST_SUMMARY_2026-06-16.zh.md");
    expect(indexText).toContain("LAEL_FULL_REGRESSION_QA_REPORT_2026-06-16.zh.md");
    expect(indexText).toContain("LAEL_WALLET_STABILITY_FIX_REPORT_2026-06-16.zh.md");
    expect(indexText).toContain("LAEL_PUBLIC_DEMO_ITERATION_TEST_REPORT_2026-06-18.zh.md");
    expect(indexText).toContain("LAEL_PROJECT_ITERATION_HISTORY_2026-06-02.zh.md");
    expect(indexText).toContain("LAEL_COLLABORATION_HANDOFF_2026-06-02.zh.md");
  });
});
