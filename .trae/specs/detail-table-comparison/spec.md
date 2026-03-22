# 四个模板详细数据添加环比功能 Spec

## Why
当前只有"内容概括"区域显示了环比数据，用户希望在四个模板（top10/product/comparison/region）的"详细数据"表格中也能看到环比数据。

## What Changes
- [x] 在 top10 模板详细数据表格中添加环比列
- [x] 在 product 模板详细数据表格中添加环比列
- [x] 在 comparison 模板详细数据表格中添加环比列
- [x] 在 region 模板详细数据表格中添加环比列
- [x] 修复 product 和 comparison 模板的 previousStats 数据结构

## Impact
- **Affected specs**: 环比显示功能
- **Affected code**: 
  - `src/templates/top10/view.vue`
  - `src/templates/product/view.vue`
  - `src/templates/comparison/view.vue`
  - `src/templates/region/view.vue`
  - `src/stores/mapping.js`

## ADDED Requirements
### Requirement: 详细数据表格环比列
详细数据表格应显示与对比时间段的比较数据。

#### Scenario: 表格显示环比
- **WHEN** 存在对比时间段数据（previousStats 不为空）
- **THEN** 表格中应显示环比变化列

#### Scenario: 无对比数据
- **WHEN** 不存在对比时间段数据
- **THEN** 环比列应显示"-"或保持空白，不影响其他功能
