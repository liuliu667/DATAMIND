# 修复环比功能 - 日期解析问题 Spec

## Why
当前环比功能的自动计算上一周期失败，核心问题是：
1. 日期解析使用严格模式 `dayjs(str, formats, true)`，解析失败时无法 fallback
2. 没有处理 Excel 日期序列号（如 45234）
3. 当前周期能正常过滤数据，说明日期解析在某些场景下有效，但上一周期过滤失败

## What Changes
- [x] 移除 dayjs 严格模式，使用宽松模式解析
- [x] 添加 Excel 序列号（Serial Number）支持
- [x] 统一日期解析逻辑，使用 parseDateToYYYYMMDD 函数
- [x] 移除 calculateResultsWithComparison 中的重复日期解析代码
- [x] 保留原有的灵活解析逻辑作为 fallback

## Impact
- **Affected specs**: 环比计算功能
- **Affected code**: `src/stores/mapping.js`

## ADDED Requirements
### Requirement: Excel 序列号支持
系统应能正确解析 Excel 中的日期序列号。

#### Scenario: Excel 日期序列号
- **WHEN** Excel 中的日期值是数字序列号（如 45234）
- **THEN** 系统应将其转换为 YYYYMMDD 格式进行存储和比较

#### Scenario: 宽松模式解析
- **WHEN** 日期格式不符合严格格式时
- **THEN** 系统应尝试使用 dayjs 自动解析，而不是直接返回 invalid

## MODIFIED Requirements
### Requirement: 日期解析逻辑
修改 calculateResultsWithComparison 中的日期过滤逻辑，统一使用 parseDateToYYYYMMDD 函数。

## REMOVED Requirements
### Requirement: 严格模式日期解析
移除 `dayjs(dateStr, ['YYYYMMDD', 'YYYY-MM-DD', 'YYYY/MM/DD'], true)` 中的严格模式参数。
