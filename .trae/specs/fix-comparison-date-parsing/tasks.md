# Tasks

## Phase 1: 增强 parseDateToYYYYMMDD 函数

- [x] Task 1.1: 添加 Excel 序列号支持
  - [x] SubTask 1.1.1: 检测数值型日期序列号（如 40000-50000 范围）
  - [x] SubTask 1.1.2: 将序列号转换为日期字符串
  - [x] SubTask 1.1.3: 处理可能的 .xlsx 格式（带小数的序列号）

## Phase 2: 统一日期解析逻辑

- [x] Task 2.1: 修改 calculateResultsWithComparison 中的日期过滤逻辑
  - [x] SubTask 2.1.1: 移除 dayjs 严格模式（去掉第三个参数 true）
  - [x] SubTask 2.1.2: 统一使用 parseDateToYYYYMMDD 函数进行解析
  - [x] SubTask 2.1.3: 添加解析失败的日志记录

## Phase 3: 验证

- [ ] Task 3.1: 测试当前周期过滤正常
- [ ] Task 3.2: 测试上一周期过滤正常
- [ ] Task 3.3: 测试环比数据显示正常

## Phase 4: 清理

- [ ] Task 4.1: 移除所有调试日志（console.log）
- [ ] Task 4.2: 确认没有冗余代码
