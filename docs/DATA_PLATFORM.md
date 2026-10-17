# B 数据平台：数据库基础

本切片关联 Issue #1，只建立 PostgreSQL 数据模型和企业隔离边界，不修改小程序页面、视觉模板、营销文案或现有生成接口。

迁移包含企业、用户、成员、API 令牌摘要、产品、SKU、规格定义、规格值和资产元数据。API、微信登录、对象存储读写和部署脚本留到后续独立 PR。

## 数据关系

```text
organizations ──< memberships >── users
                       │
                       └── api_tokens

organizations ──< products ──< skus ──< sku_spec_values >── spec_definitions
       │              │          │
       └──────────────┴──────────┴──< assets
```

规格值必须保存 `source_type`、`source_ref` 和 `review_status`。AI 或 OCR 结果不能绕过这些字段直接覆盖已确认参数。

## 应用迁移

准备 PostgreSQL 16 数据库后执行：

```powershell
$env:DATABASE_URL='postgresql://<user>:<password>@127.0.0.1:5432/shangxintu'
psql $env:DATABASE_URL -v ON_ERROR_STOP=1 -f backend/migrations/001_industrial_catalog.sql
```

令牌原文不得写入数据库；`api_tokens.token_hash` 只保存 SHA-256 十六进制摘要。运行时鉴权接入将在后续 PR 完成。

## 企业隔离

产品、SKU、规格和资产表同时使用复合外键与 PostgreSQL RLS。应用开始企业事务时必须设置当前企业和用户：

```sql
BEGIN;
SELECT set_config('app.organization_id', '<organization uuid>', true);
SELECT set_config('app.user_id', '<user uuid>', true);
-- 在同一事务内执行企业数据查询
COMMIT;
```

核心业务表启用并强制执行 RLS；缺少 `app.organization_id` 时不会返回企业业务数据。服务端数据库角色不应拥有绕过 RLS 的权限。

对象存储在 `assets` 表中只保存 provider、bucket、object key、内容类型、大小与 SHA-256，不保存带签名的临时下载地址。当前上传接口仍使用本地文件，后续接入 S3/OSS/MinIO 时应先完成企业鉴权和保留策略。
