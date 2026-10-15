# 参与开发

感谢参与“上新图 Industry”。项目采用 **Issue → 功能分支 → Pull Request → 代码审查 → 合并** 的协作方式，任何人都不要直接向 `main` 提交业务代码。

## 开始之前

1. 从 `main` 拉取最新代码。
2. 先在 GitHub Issue 中确认任务范围和验收标准。
3. 一个分支只解决一个问题，避免把无关修改混在一起。
4. 不得提交 API Key、AppSecret、用户图片、企业资料或真实客户数据。

## 分支命名

- `feature/<功能>`：新增功能，例如 `feature/product-database`
- `fix/<问题>`：修复缺陷，例如 `fix/preview-overflow`
- `docs/<内容>`：文档修改，例如 `docs/api-guide`
- `chore/<内容>`：工程配置，例如 `chore/ci-tests`

## 提交信息

使用清晰、可回溯的提交信息：

```text
feat: add product specification model
fix: prevent duplicate generation requests
docs: document local AI setup
test: cover SKU parameter validation
```

## Pull Request 要求

PR 描述至少说明：

- 做了什么；
- 为什么这样做；
- 如何测试；
- 涉及哪些页面或接口；
- 是否有截图、录屏或数据结构变化；
- 是否关联 Issue。

合并前必须满足：

- 至少一名队友完成审查；
- 自动测试通过；
- 涉及小程序页面时完成微信开发者工具编译；
- 涉及视觉或相册能力时完成真机验证；
- 不包含密钥、个人信息和未脱敏企业数据。

## 本地验证

```powershell
cd backend
npm.cmd test
npm.cmd start
```

微信开发者工具导入 `frontend/`。AI 能力需要把 `backend/.env.example` 复制成 `backend/.env` 并填写自己的密钥；`.env` 永远不要提交。

