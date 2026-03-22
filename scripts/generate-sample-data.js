import * as XLSX from 'xlsx/xlsx.mjs';
import fs from 'fs';
import path from 'path';

// 配置
const TOTAL_ROWS = 2000;
const START_DATE = new Date('2025-07-01');
const END_DATE = new Date('2025-12-31');

// 销售员配置（20人，分头部/中部/尾部）
const salespeople = [
  // 头部3人 - 销冠级
  { name: '张伟', level: 'top', minAmount: 8000, maxAmount: 50000 },
  { name: '李娜', level: 'top', minAmount: 8000, maxAmount: 50000 },
  { name: '王强', level: 'top', minAmount: 8000, maxAmount: 50000 },
  // 中部10人 - 主力
  { name: '刘洋', level: 'middle', minAmount: 3000, maxAmount: 25000 },
  { name: '陈静', level: 'middle', minAmount: 3000, maxAmount: 25000 },
  { name: '杨帆', level: 'middle', minAmount: 3000, maxAmount: 25000 },
  { name: '赵敏', level: 'middle', minAmount: 3000, maxAmount: 25000 },
  { name: '黄磊', level: 'middle', minAmount: 3000, maxAmount: 25000 },
  { name: '周婷', level: 'middle', minAmount: 3000, maxAmount: 25000 },
  { name: '吴磊', level: 'middle', minAmount: 3000, maxAmount: 25000 },
  { name: '徐丽', level: 'middle', minAmount: 3000, maxAmount: 25000 },
  { name: '孙鹏', level: 'middle', minAmount: 3000, maxAmount: 25000 },
  { name: '马丽', level: 'middle', minAmount: 3000, maxAmount: 25000 },
  // 尾部7人 - 待提升
  { name: '朱峰', level: 'bottom', minAmount: 500, maxAmount: 15000 },
  { name: '胡雪', level: 'bottom', minAmount: 500, maxAmount: 15000 },
  { name: '郭明', level: 'bottom', minAmount: 500, maxAmount: 15000 },
  { name: '林晨', level: 'bottom', minAmount: 500, maxAmount: 15000 },
  { name: '何欣', level: 'bottom', minAmount: 500, maxAmount: 15000 },
  { name: '高峰', level: 'bottom', minAmount: 500, maxAmount: 15000 },
  { name: '罗丹', level: 'bottom', minAmount: 500, maxAmount: 15000 },
];

// 产品配置（15种，分明星/常规/长尾）
const products = [
  // 明星产品3种 - 高频出现
  { name: '智能办公套件A版', weight: 15 },
  { name: '企业云服务包', weight: 12 },
  { name: '数据分析专业版', weight: 10 },
  // 常规产品7种 - 中频出现
  { name: '基础办公套件', weight: 6 },
  { name: '云存储扩容包', weight: 5 },
  { name: '安全防护套装', weight: 5 },
  { name: '协同办公平台', weight: 4 },
  { name: '移动办公APP', weight: 4 },
  { name: '培训服务包', weight: 3 },
  { name: '技术支持服务', weight: 3 },
  // 长尾产品5种 - 低频出现
  { name: '定制开发服务', weight: 1 },
  { name: '数据迁移服务', weight: 1 },
  { name: '系统整合方案', weight: 1 },
  { name: '专属客服服务', weight: 1 },
  { name: '优先升级权益', weight: 1 },
];

// 地区配置（6个，带权重）
const regions = [
  { name: '华东', weight: 40 },
  { name: '华南', weight: 20 },
  { name: '华北', weight: 15 },
  { name: '华中', weight: 12 },
  { name: '西南', weight: 8 },
  { name: '西北', weight: 5 },
];

// 辅助函数：生成指定范围内的随机整数
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 辅助函数：根据权重随机选择
function weightedRandom(items) {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) {
      return item;
    }
  }
  return items[0];
}

// 辅助函数：生成随机日期（2025年7-12月）
function randomDate() {
  const timeDiff = END_DATE.getTime() - START_DATE.getTime();
  const randomTime = Math.random() * timeDiff;
  const date = new Date(START_DATE.getTime() + randomTime);
  return date;
}

// 辅助函数：格式化日期为YYYYMMDD
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

// 生成数据
console.log('开始生成示例数据...');
console.log(`目标行数: ${TOTAL_ROWS}`);

const data = [];

for (let i = 0; i < TOTAL_ROWS; i++) {
  // 随机选择销售员
  const salesperson = salespeople[randomInt(0, salespeople.length - 1)];
  
  // 根据销售员等级生成销售额
  const amount = randomInt(salesperson.minAmount, salesperson.maxAmount);
  
  // 随机选择产品（带权重）
  const product = weightedRandom(products);
  
  // 随机选择地区（带权重）
  const region = weightedRandom(regions);
  
  // 生成随机日期
  const date = randomDate();
  
  data.push({
    销售员: salesperson.name,
    销售额: amount,
    日期: formatDate(date),
    产品名称: product.name,
    地区: region.name,
  });
}

// 按日期排序
console.log('按日期排序...');
data.sort((a, b) => {
  return parseInt(a.日期) - parseInt(b.日期);
});

// 创建工作簿
console.log('创建Excel文件...');
const worksheet = XLSX.utils.json_to_sheet(data);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, '销售数据');

// 确保目录存在
const outputDir = path.join(process.cwd(), '示例数据');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 保存文件 - 使用 write 生成 Buffer 再写入
const outputPath = path.join(outputDir, 'DATAMIND_示例数据.xlsx');
const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
fs.writeFileSync(outputPath, buffer);

console.log(`\n✅ 示例数据生成成功！`);
console.log(`文件路径: ${outputPath}`);
console.log(`总行数: ${data.length}`);

// 统计信息
const uniqueSalespeople = new Set(data.map(row => row.销售员)).size;
const uniqueProducts = new Set(data.map(row => row.产品名称)).size;
const uniqueRegions = new Set(data.map(row => row.地区)).size;
const totalAmount = data.reduce((sum, row) => sum + row.销售额, 0);
const minDate = data[0].日期;
const maxDate = data[data.length - 1].日期;

console.log('\n数据统计:');
console.log(`- 销售员人数: ${uniqueSalespeople}`);
console.log(`- 产品种类: ${uniqueProducts}`);
console.log(`- 地区数量: ${uniqueRegions}`);
console.log(`- 总销售额: ${totalAmount.toLocaleString()} 元`);
console.log(`- 日期范围: ${minDate} 至 ${maxDate}`);
console.log(`- 平均每笔: ${Math.round(totalAmount / data.length).toLocaleString()} 元`);

// 检查同一销售员多条记录
const salespersonCounts = {};
data.forEach(row => {
  salespersonCounts[row.销售员] = (salespersonCounts[row.销售员] || 0) + 1;
});
const multiRecordSalespeople = Object.entries(salespersonCounts)
  .filter(([name, count]) => count > 1)
  .map(([name, count]) => `${name}(${count}条)`);

console.log(`\n- 有多条记录的销售员: ${multiRecordSalespeople.length}人`);
console.log(`  ${multiRecordSalespeople.slice(0, 5).join(', ')}${multiRecordSalespeople.length > 5 ? '...' : ''}`);

console.log('\n示例数据预览（前5行）:');
data.slice(0, 5).forEach((row, index) => {
  console.log(`${index + 1}. ${row.销售员} | ${row.销售额.toLocaleString()}元 | ${row.日期} | ${row.产品名称} | ${row.地区}`);
});
