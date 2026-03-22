<template>
  <div class="comparison-view" v-if="calculationResult">
    <div class="view-header">
      <div class="header-badge">
        <el-icon><UserFilled /></el-icon>
      </div>
      <div class="header-content">
        <h2 class="view-title">团队业绩对比</h2>
        <p class="view-subtitle">
          <el-icon><Calendar /></el-icon>
          数据时间范围：{{ stats.period }}
        </p>
      </div>
      <button class="dm-btn dm-btn-secondary" @click="downloadChart">
        <el-icon><Download /></el-icon>
        <span>下载图表</span>
      </button>
    </div>

    <div class="insight-card">
      <div class="insight-header">
        <div class="insight-title">
          <el-icon><InfoFilled /></el-icon>
          <span>数据洞察</span>
        </div>
        <div class="insight-theory">
          依据：绩效差距理论
        </div>
      </div>
      <div v-if="stats.totalEmployees > 0" class="insight-content">
        <p class="insight-text">
          团队平均业绩 <span class="highlight avg">{{ formatMoney(stats.avgSales) }}</span><template v-if="comparisonData && comparisonData.avgSales.value !== null">(<span :class="comparisonData.avgSales.isPositive ? 'positive' : 'negative'">{{ comparisonData.avgSales.text }}</span>)</template>，
          <span class="highlight above">{{ stats.aboveAvgCount }} 人超标</span>，
          <span class="highlight below">{{ stats.belowAvgCount }} 人待辅导</span>。
          头尾差距 <span class="highlight gap">{{ stats.maxGap.toFixed(1) }} 倍</span>。
        </p>
      </div>
      <div v-else class="insight-content empty">
        <p>暂无有效数据</p>
      </div>
    </div>

    <div class="diagnosis-card">
      <div class="diagnosis-header">
        <div class="diagnosis-title">
          <el-icon><TrendCharts /></el-icon>
          <span>专业诊断</span>
        </div>
        <div class="diagnosis-tabs">
          <button
            :class="['tab-btn', { active: diagnosisVersion === 'simple' }]"
            @click="diagnosisVersion = 'simple'"
          >
            📖 通俗理解版
          </button>
          <button
            :class="['tab-btn', { active: diagnosisVersion === 'professional' }]"
            @click="diagnosisVersion = 'professional'"
          >
            📚 HR专业版
          </button>
        </div>
      </div>
      <div class="diagnosis-content">
        <p v-if="diagnosisVersion === 'simple'" class="diagnosis-text">
          {{ simpleDiagnosis }}
        </p>
        <p v-else class="diagnosis-text professional">
          {{ professionalDiagnosis }}
        </p>
      </div>
    </div>

    <div class="advice-card">
      <div class="advice-header">
        <div class="advice-title">
          <span class="advice-icon">💡</span>
          <span>管理建议</span>
        </div>
      </div>
      <div class="advice-content">
        <ul class="advice-list">
          <li v-for="(advice, index) in managementAdvice" :key="index">{{ advice }}</li>
        </ul>
      </div>
    </div>

    <div class="disclaimer-card">
      <p>⚠️ 本诊断基于人力资源绩效管理理论及数据统计分析，仅供参考，不构成决策依据。</p>
    </div>

    <div class="chart-section">
      <div class="section-card">
        <div class="card-header">
          <div class="header-title">
            <el-icon><Histogram /></el-icon>
            <span>全员业绩对比（前30名）</span>
          </div>
        </div>
        <div ref="chartRef" class="chart-container"></div>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-item">
        <div class="stat-icon">
          <el-icon><TrendCharts /></el-icon>
        </div>
        <div class="stat-content">
          <span class="stat-label">团队均值</span>
          <span class="stat-value">{{ formatMoney(stats.avgSales) }}</span>
            <span v-if="comparisonData && comparisonData.avgSales.value !== null" :class="['change-tag', comparisonData.avgSales.isPositive ? 'up' : 'down']">{{ comparisonData.avgSales.text }}</span>
        </div>
      </div>
      <div class="stat-item highlight">
        <div class="stat-icon">
          <el-icon><Trophy /></el-icon>
        </div>
        <div class="stat-content">
          <span class="stat-label">冠军业绩</span>
          <span class="stat-value">{{ formatMoney(allEmployees[0]?.value || 0) }}</span>
        </div>
      </div>
      <div class="stat-item warning">
        <div class="stat-icon">
          <el-icon><Warning /></el-icon>
        </div>
        <div class="stat-content">
          <span class="stat-label">垫底业绩</span>
          <span class="stat-value">{{ formatMoney(allEmployees[allEmployees.length - 1]?.value || 0) }}</span>
        </div>
      </div>
      <div class="stat-item">
        <div class="stat-icon">
          <el-icon><CircleCheck /></el-icon>
        </div>
        <div class="stat-content">
          <span class="stat-label">达标率</span>
          <span class="stat-value">{{ formatPercent(aboveAvgRate, 0) }}</span>
          <el-progress 
            :percentage="parseFloat((aboveAvgRate * 100).toFixed(0))" 
            :show-text="false"
            :stroke-width="6"
            class="stat-progress"
          />
        </div>
      </div>
    </div>

    <div class="action-bar">
      <button class="dm-btn dm-btn-primary" @click="handleExportPDF" :disabled="exportingPDF">
        <el-icon><Document /></el-icon>
        <span>{{ exportingPDF ? '导出中...' : '导出 PDF 报告' }}</span>
      </button>
      <button class="dm-btn dm-btn-secondary" @click="handleExportExcel">
        <el-icon><Download /></el-icon>
        <span>下载完整数据</span>
      </button>
    </div>

    <div class="table-section">
      <div class="section-card">
        <div class="card-header">
          <div class="header-title">
            <el-icon><List /></el-icon>
            <span>详细数据</span>
          </div>
          <div class="header-badge">
            共 {{ allEmployees.length }} 人
          </div>
        </div>
        
        <el-table 
          :data="paginatedData" 
          stripe 
          border 
          size="small" 
          class="data-table"
        >
          <el-table-column prop="rank" label="排名" width="80" align="center">
            <template #default="{ row }">
              <div class="rank-cell">
                <span v-if="row.rank === 1" class="rank-medal gold">🥇</span>
                <span v-else-if="row.rank === 2" class="rank-medal silver">🥈</span>
                <span v-else-if="row.rank === 3" class="rank-medal bronze">🥉</span>
                <span v-else class="rank-number">{{ row.rank }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="name" label="姓名" min-width="120" />
          <el-table-column prop="value" label="销售额" width="150" align="right">
            <template #default="{ row }">
              {{ formatMoneyExact(row.value) }}
            </template>
          </el-table-column>
          <el-table-column prop="vsAvg" label="与均值差额" width="120" align="right">
            <template #default="{ row }">
              <span :class="row.vsAvg >= 0 ? 'positive' : 'negative'">
                {{ row.vsAvg >= 0 ? '+' : '' }}{{ formatPercent(row.vsAvg, 0) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="环比" width="100" align="center">
            <template #default="{ row }">
              <span :class="getEmployeeChange(row).isPositive ? 'positive' : (getEmployeeChange(row).text !== '-' && getEmployeeChange(row).text !== '持平' ? 'negative' : '')">
                {{ getEmployeeChange(row).text }}
              </span>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="allEmployees.length"
            layout="total, sizes, prev, pager, next, jumper"
            background
          />
        </div>
      </div>
    </div>
  </div>
  <div v-else class="empty-state">
    <el-empty description="暂无数据" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import * as echarts from 'echarts'
import {
  Download,
  Document,
  UserFilled,
  Calendar,
  InfoFilled,
  Histogram,
  TrendCharts,
  Trophy,
  Warning,
  CircleCheck,
  List
} from '@element-plus/icons-vue'
import { useMappingStore } from '../../stores/mapping.js'
import { formatMoney, formatMoneyExact, formatPercent, formatSmartNumber, formatChangeText } from '../../utils/formatters.js'
import { generatePDF } from '../../utils/pdfGeneratorHtml.js'
import { exportExcel } from '../../utils/excelExporter.js'

const mappingStore = useMappingStore()

const chartRef = ref(null)
let chart = null
const exportingPDF = ref(false)

const calculationResult = computed(() => mappingStore.calculationResult)
const previousStats = computed(() => calculationResult.value?.previousStats || null)
const previousAllEmployees = computed(() => previousStats.value?.allEmployees || [])
const allEmployees = computed(() => calculationResult.value?.allEmployees || [])
const comparisonData = computed(() => {
  if (!previousStats.value) return null
  return {
    avgSales: formatChangeText(stats.value.avgSales, previousStats.value.avgSales),
    totalEmployees: previousStats.value.totalEmployees !== undefined 
      ? { text: `${previousStats.value.totalEmployees}人`, value: null, isPositive: false }
      : null
  }
})
const stats = computed(() => calculationResult.value?.statistics || {
  totalEmployees: 0,
  totalSales: 0,
  avgSales: 0,
  aboveAvgCount: 0,
  belowAvgCount: 0,
  topPerformer: '',
  bottomPerformer: '',
  maxGap: 0,
  period: ''
})

const aboveAvgRate = computed(() => {
  if (stats.value.totalEmployees === 0) return 0
  return stats.value.aboveAvgCount / stats.value.totalEmployees
})

const diagnosisVersion = ref('simple')

const simpleDiagnosis = computed(() => {
  if (stats.value.totalEmployees === 0) return '暂无有效数据'
  const belowAvgCount = stats.value.belowAvgCount
  const maxGap = stats.value.maxGap.toFixed(1)
  const aboveAvgRateValue = (aboveAvgRate.value * 100).toFixed(0)
  if (stats.value.maxGap > 4) {
    return `团队中${aboveAvgRateValue}%的人员业绩在平均线以上，头尾差距达${maxGap}倍，团队内部能力分布存在明显断层。建议对头部员工进行成功经验总结，对尾部员工进行业绩改进辅导。`
  }
  return `团队中${aboveAvgRateValue}%的人员业绩在平均线以上，头尾差距达${maxGap}倍，团队业绩分布相对均衡。建议持续关注团队稳定性，保持当前良好的发展态势。`
})

const professionalDiagnosis = computed(() => {
  if (stats.value.totalEmployees === 0) return '暂无有效数据'
  const belowAvgCount = stats.value.belowAvgCount
  const maxGap = stats.value.maxGap.toFixed(1)
  const aboveAvgRateValue = (aboveAvgRate.value * 100).toFixed(0)
  const gapThreshold = 3
  const reachRateThreshold = 45
  if (stats.value.maxGap > 4 || aboveAvgRate.value * 100 < 35) {
    return `基于绩效差距理论，团队绩效分布呈现显著分化。达标率为${aboveAvgRateValue}%，头尾绩效差距达${maxGap}倍，超出健康阈值（${gapThreshold}倍）。建议实施差异化绩效管理策略，对尾部员工启动绩效改进计划（PIP），明确改进目标与时间节点。`
  }
  return `基于绩效差距理论，团队绩效分布相对健康。达标率为${aboveAvgRateValue}%，头尾差距为${maxGap}倍，符合健康阈值（${gapThreshold}倍）范围。建议持续关注团队稳定性，强化中腰部员工能力建设。`
})

const managementAdvice = computed(() => {
  const advices = []
  if (stats.value.maxGap > 4) {
    advices.push('建议对头部员工进行成功经验总结，形成可复制的方法论')
  }
  if (stats.value.belowAvgCount > stats.value.totalEmployees * 0.4) {
    advices.push(`建议对${stats.value.belowAvgCount}名业绩偏低人员进行一对一沟通，明确改进方向`)
  }
  if (stats.value.maxGap > 3) {
    advices.push('建议评估现有激励体系是否足够激励中腰部员工成长')
  }
  if (advices.length === 0) {
    advices.push('建议持续关注团队绩效分布，保持当前良好的发展态势')
  }
  return advices
})

const currentPage = ref(1)
const pageSize = ref(20)

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return allEmployees.value.slice(start, end)
})

function getEmployeeChange(row) {
  if (!previousAllEmployees.value || previousAllEmployees.value.length === 0) {
    return { text: '-', isPositive: false }
  }
  const prevEmployee = previousAllEmployees.value.find(e => e.name === row.name)
  if (!prevEmployee) {
    return { text: '-', isPositive: false }
  }
  return formatChangeText(row.value, prevEmployee.value)
}

function initChart() {
  if (!chartRef.value) return

  chart = echarts.init(chartRef.value)
  updateChart()

  window.addEventListener('resize', handleResize)
}

function updateChart() {
  if (!chart || allEmployees.value.length === 0) return

  const displayData = allEmployees.value.slice(0, 30)
  const names = displayData.map(item => item.name)
  const values = displayData.map(item => ({
    value: item.value,
    itemStyle: {
      color: item.isAboveAvg 
        ? new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#10b981' },
            { offset: 1, color: '#059669' }
          ])
        : new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#ef4444' },
            { offset: 1, color: '#dc2626' }
          ]),
      borderRadius: [6, 6, 0, 0]
    }
  }))

  // 智能确定Y轴单位
  const maxValue = Math.max(...displayData.map(item => item.value))
  const useWanUnit = maxValue >= 10000

  const option = {
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '10%',
      containLabel: true
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      textStyle: { color: '#1e293b' },
      formatter: params => {
        const item = displayData[params[0].dataIndex]
        const value = params[0].value
        const formattedValue = useWanUnit ? (value / 10000).toFixed(2) + '万' : formatMoney(value)
        return `
          <div style="font-weight:600;margin-bottom:5px">${params[0].name}</div>
          <div>销售额: ${formattedValue}</div>
          <div>vs平均: ${item.vsAvg > 0 ? '+' : ''}${(item.vsAvg * 100).toFixed(1)}%</div>
          <div>状态: ${item.isAboveAvg ? '<span style="color:#10b981">达标</span>' : '<span style="color:#ef4444">未达标</span>'}</div>
        `
      }
    },
    xAxis: {
      type: 'category',
      data: names,
      axisLabel: {
        interval: 0,
        rotate: 45,
        fontSize: 11,
        color: '#64748b'
      },
      axisLine: { lineStyle: { color: '#e2e8f0' } }
    },
    yAxis: {
      type: 'value',
      name: useWanUnit ? '销售额 (万)' : '销售额',
      axisLabel: {
        color: '#64748b',
        formatter: value => useWanUnit ? (value / 10000).toFixed(0) : formatSmartNumber(value)
      },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } }
    },
    series: [{
      type: 'bar',
      data: values,
      barWidth: '60%',
      label: {
        show: true,
        position: 'top',
        fontSize: 10,
        color: '#64748b',
        formatter: params => useWanUnit ? (params.value / 10000).toFixed(1) + '万' : formatSmartNumber(params.value)
      }
    }]
  }

  chart.setOption(option)
}

function handleResize() {
  chart?.resize()
}

async function downloadChart() {
  if (!chart) return
  
  try {
    const url = chart.getDataURL({ type: 'png', pixelRatio: 2 })
    const link = document.createElement('a')
    link.download = `团队业绩对比_${Date.now()}.png`
    link.href = url
    link.click()
  } catch (error) {
    console.error('下载图表失败:', error)
    alert('下载图表失败')
  }
}

async function handleExportPDF() {
  if (!chart) return
  
  exportingPDF.value = true
  try {
    const chartImage = chart.getDataURL({ type: 'png', pixelRatio: 2 })
    await generatePDF('comparison', calculationResult.value, mappingStore.dateRange, chartImage)
  } catch (error) {
    console.error('PDF导出失败:', error)
    alert('PDF导出失败: ' + error.message)
  } finally {
    exportingPDF.value = false
  }
}

async function handleExportExcel() {
  try {
    await exportExcel(allEmployees.value, `团队业绩对比_${Date.now()}.xlsx`, 'comparison')
  } catch (error) {
    console.error('Excel导出失败:', error)
    alert('Excel导出失败: ' + error.message)
  }
}

onMounted(() => {
  initChart()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  chart?.dispose()
})

watch(() => calculationResult.value, () => {
  updateChart()
}, { deep: true })
</script>

<style scoped>
.comparison-view {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.view-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
  padding: 24px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.header-badge {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 28px;
  box-shadow: 0 8px 16px -4px rgba(139, 92, 246, 0.3);
}

.header-content {
  flex: 1;
}

.view-title {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.view-subtitle {
  font-size: 14px;
  color: #64748b;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.insight-card {
  background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%);
  border-radius: 16px;
  padding: 20px 24px;
  margin-bottom: 24px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  border: 1px solid #c4b5fd;
}

.insight-icon {
  width: 40px;
  height: 40px;
  background: white;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #7c3aed;
  font-size: 20px;
  flex-shrink: 0;
}

.insight-content {
  flex: 1;
}

.insight-content.empty {
  color: #64748b;
}

.insight-text {
  font-size: 15px;
  line-height: 1.8;
  color: #4c1d95;
  margin: 0;
}

.highlight {
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 6px;
}

.highlight.avg {
  background: #dbeafe;
  color: #1e40af;
}

.highlight.above {
  background: #d1fae5;
  color: #065f46;
}

.highlight.below {
  background: #fee2e2;
  color: #991b1b;
}

.highlight.gap {
  background: #fef3c7;
  color: #92400e;
}

.positive {
  color: #ef4444;
  font-weight: 600;
}

.negative {
  color: #22c55e;
  font-weight: 600;
}

.change-tag {
  font-size: 12px;
  margin-left: 8px;
  padding: 2px 6px;
  border-radius: 4px;
}

.change-tag.up {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.change-tag.down {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
}

.insight-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.insight-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #374151;
}

.insight-theory {
  font-size: 12px;
  color: #9ca3af;
  background: #f3f4f6;
  padding: 4px 10px;
  border-radius: 6px;
}

.insight-card .insight-icon {
  display: none;
}

.diagnosis-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 20px 24px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.diagnosis-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.diagnosis-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #374151;
}

.diagnosis-tabs {
  display: flex;
  gap: 8px;
}

.tab-btn {
  padding: 6px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  color: #6b7280;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  border-color: #7c3aed;
  color: #7c3aed;
}

.tab-btn.active {
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
  color: white;
  border-color: transparent;
}

.diagnosis-content {
  min-height: 60px;
}

.diagnosis-text {
  font-size: 14px;
  line-height: 1.8;
  color: #4b5563;
  margin: 0;
}

.diagnosis-text.professional {
  color: #374151;
  font-style: italic;
}

.advice-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 20px 24px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.advice-header {
  margin-bottom: 12px;
}

.advice-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #374151;
}

.advice-icon {
  font-size: 18px;
}

.advice-list {
  margin: 0;
  padding-left: 20px;
}

.advice-list li {
  font-size: 14px;
  line-height: 1.8;
  color: #4b5563;
  margin-bottom: 6px;
}

.advice-list li:last-child {
  margin-bottom: 0;
}

.disclaimer-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 24px;
}

.disclaimer-card p {
  font-size: 12px;
  color: #9ca3af;
  margin: 0;
  text-align: center;
}

.chart-section {
  margin-bottom: 24px;
}

.section-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.card-header {
  padding: 20px 24px;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.chart-container {
  height: 400px;
  padding: 20px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-item {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px -4px rgba(0, 0, 0, 0.1);
}

.stat-item.highlight {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
}

.stat-item.warning {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
}

.stat-icon {
  width: 44px;
  height: 44px;
  background: #f1f5f9;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  font-size: 20px;
}

.stat-item.highlight .stat-icon {
  background: #fbbf24;
  color: white;
}

.stat-item.warning .stat-icon {
  background: #ef4444;
  color: white;
}

.stat-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 13px;
  color: #64748b;
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
}

.stat-progress {
  margin-top: 8px;
}

.action-bar {
  display: flex;
  gap: 12px;
  justify-content: center;
  padding: 24px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.dm-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.dm-btn-primary {
  background: linear-gradient(135deg, #5b6af5 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(91, 106, 245, 0.3);
}

.dm-btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(91, 106, 245, 0.4);
}

.dm-btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.dm-btn-secondary {
  background: #f1f5f9;
  color: #475569;
}

.dm-btn-secondary:hover {
  background: #e2e8f0;
}

.empty-state {
  padding: 60px 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.table-section {
  margin-bottom: 24px;
}

.table-section .header-badge {
  padding: 4px 12px;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.data-table {
  margin: 0 20px;
  width: calc(100% - 40px) !important;
}

.data-table :deep(th) {
  background: #f9fafb !important;
  font-weight: 600;
  color: #374151;
}

.rank-cell {
  display: flex;
  align-items: center;
  justify-content: center;
}

.rank-medal {
  font-size: 22px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.rank-number {
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  border-radius: 50%;
}

.positive {
  color: #059669;
  font-weight: 600;
}

.negative {
  color: #dc2626;
  font-weight: 600;
}

.pagination-container {
  margin-top: 20px;
  padding: 0 20px 20px;
  display: flex;
  justify-content: center;
}

@media (max-width: 1024px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .comparison-view {
    padding: 16px;
  }

  .view-header {
    flex-direction: column;
    text-align: center;
  }

  .stats-row {
    grid-template-columns: 1fr;
  }

  .action-bar {
    flex-direction: column;
  }

  .insight-header {
    flex-direction: column;
    gap: 8px;
  }

  .diagnosis-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .diagnosis-tabs {
    width: 100%;
  }

  .tab-btn {
    flex: 1;
    text-align: center;
  }
}
</style>