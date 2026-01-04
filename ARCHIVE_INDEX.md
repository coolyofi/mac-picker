# 文档归档索引（建议移除或转为附件）

说明：下面列出的文档内容已被合并入 MASTER_DOCUMENTATION.md、QUICK_START.md 或 IMPLEMENTATION_SUMMARY.md。它们可保留为历史归档（例如 docs/archive/ 下），也可删除以减少仓库噪声。

建议保留两个主要文档并将下列文件移动到 docs/archive/ 或删除：

归档候选清单与摘要：

- ADVANCED_LIQUID_BACKGROUND.md — 液态背景高级配置指南（已合并要点至 IMPLEMENTATION_SUMMARY.md / QUICK_REFERENCE）。
- ANIMATED_COUNT_USAGE.md — AnimatedCount 组件使用与示例（可归档，若常用可留作组件 README）。
- BACKGROUND_QUICK_REFERENCE.md — 背景系统速查表（内容已并入 ADVANCED_LIQUID_BACKGROUND 的速查节）。
- BACKGROUND_UPGRADE_REPORT.md — 背景升级对比报告（升级结论已合并）。
- COMPLETION_REPORT.md — 项目完成报告（总结性内容已并入 IMPLEMENTATION_SUMMARY.md）。
- FILTER_SYSTEM_DOCS.md — 筛选系统完整方案（核心要点已归入 IMPLEMENTATION_SUMMARY.md；若需要保留深度文档可移动至 docs/）。
- PROGRESSIVE_RENDERING_IMPLEMENTATION.md — 渐进式渲染实现方案（若团队需要保留实现细节可移动至 docs/archive/）。
- PROGRESSIVE_RENDERING_QUICK_GUIDE.md — 渐进渲染速查（可归档）。
- TESTING_GUIDE.md — 测试指南（建议保留或移动到 docs/，因为包含测试清单）。
- UPGRADE_COMPLETION_REPORT.md — 升级完成报告（可归档）。

操作建议（二选一，团队决定其一）：
1) 推荐：将上述归档候选移动到 docs/archive/ 下，仅在 MASTER_DOCUMENTATION.md 中保留链接与短说明；保留 QUICK_START.md 与 IMPLEMENTATION_SUMMARY.md 作为主要文档。  
2) 备选：保留 TESTING_GUIDE.md（测试频繁使用时），其余文件全部移到 docs/archive/ 或删除。

如需，本次可以继续执行移动（git mv）或删除操作；若确认，回复要执行的选项（1 或 2），我会帮你完成对应的文件移动/删除并提交一次简短的 commit。