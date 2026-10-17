const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const sql = fs.readFileSync(path.resolve(__dirname, '../migrations/001_industrial_catalog.sql'), 'utf8')

test('数据平台迁移覆盖企业、产品、SKU、规格和资产实体', () => {
  const tables = [
    'organizations',
    'users',
    'memberships',
    'api_tokens',
    'products',
    'skus',
    'spec_definitions',
    'sku_spec_values',
    'assets'
  ]
  for (const table of tables) assert.match(sql, new RegExp(`CREATE TABLE ${table}\\b`))
})

test('规格值保留来源和人工审核状态', () => {
  assert.match(sql, /source_type text NOT NULL/)
  assert.match(sql, /source_ref text NOT NULL/)
  assert.match(sql, /review_status text NOT NULL/)
  assert.match(sql, /reviewed_by uuid REFERENCES users\(id\)/)
  assert.match(sql, /reviewed_at timestamptz/)
})

test('企业数据使用复合外键和强制 RLS 隔离', () => {
  assert.match(sql, /FOREIGN KEY \(organization_id, product_id\)/)
  assert.match(sql, /FOREIGN KEY \(organization_id, sku_id\)/)
  assert.match(sql, /FOREIGN KEY \(organization_id, spec_definition_id\)/)
  assert.match(sql, /ENABLE ROW LEVEL SECURITY/)
  assert.match(sql, /FORCE ROW LEVEL SECURITY/)
  assert.match(sql, /app\.organization_id/)
  for (const table of ['products', 'skus', 'spec_definitions', 'sku_spec_values', 'assets']) {
    assert.match(sql, new RegExp(`'${table}'`))
  }
})

test('令牌只存摘要，资产只存对象定位与完整性元数据', () => {
  assert.match(sql, /token_hash char\(64\)/)
  assert.match(sql, /storage_provider text NOT NULL/)
  assert.match(sql, /bucket text NOT NULL/)
  assert.match(sql, /object_key text NOT NULL/)
  assert.match(sql, /sha256 char\(64\)/)
})
