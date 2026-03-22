<template>
  <div class="product-view" v-if="calculationResult">
    <div class="view-header">
      <div class="header-badge">
        <el-icon><Goods /></el-icon>
      </div>
      <div class="header-content">
        <h2 class="view-title">产品盈利分析</h2>
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
          依据：激励公平理论
        </div>
      </div>
      <div v-if="stats.starProduct" class="insight-content">
        <p class="insight-text">
          <span class="highlight total">{{ formatMoney(stats.totalSales) }}</span>是本周期总销售额<template v-if="comparisonData && comparisonData.totalSales.value !== null">(<span :class="comparisonData.totalSales.isPositive ? 'positive' : 'negative'">{{ comparisonData.totalSales.text }}</span>)</template>。
          其中 <span class="highlight star">{{ stats.starProduct }}</span>是绝对主力，销售额 <span class="highlight amount">{{ formatMoney(stats.top1Value) }}</span>，
          占比 <span class="highlight percent">{{ formatPercent(stats.top1Contribution, 1) }}</span>。
          TOP3 产品贡献了 <span class="highlight contribution">{{ formatPercent(pareto.top3Contribution, 0) }}</span> 的业绩。
          共有 <span class="highlight warning">{{ pareto.longTailCount }}</span> 个长尾产品（占比&lt;5%）。
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

    <div class="dashboard-grid">
      <div class="chart-section">
        <div class="section-card">
          <div class="card-header">
            <div class="header-title">
              <el-icon><PieChart /></el-icon>
              <span>产品销售占比</span>
            </div>
          </div>
          <div ref="pieChartRef" class="chart-container"></div>
        </div>
      </div>

      <div class="chart-section">
        <div class="section-card">
          <div class="card-header">
            <div class="header-title">
              <el-icon><Histogram /></el-icon>
              <span>TOP10 产品销量</span>
            </div>
          </div>
          <div ref="barChartRef" class="chart-container"></div>
        </div>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-item highlight">
        <div class="stat-icon gold">
          <el-icon><Money /></el-icon>
        </div>
        <div class="stat-content">
          <span class="stat-label">总销售额</span>
          <span class="stat-value">{{ formatMoney(stats.totalSales) }}</span>
              <span v-if="comparisonData && comparisonData.totalSales.value !== null" :class="['change-tag', comparisonData.totalSales.isPositive ? 'up' : 'down']">{{ comparisonData.totalSales.text }}</span>
        </div>
      </div>
      <div class="stat-item">
        <div class="stat-icon">
          <el-icon><Box /></el-icon>
        </div>
        <div class="stat-content">
          <span class="stat-label">产品总数</span>
          <span class="stat-value">{{ stats.totalProducts }}</span>
        </div>
      </div>
      <div class="stat-item">
        <div class="stat-icon highlight">
          <el-icon><StarFilled /></el-icon>
        </div>
        <div class="stat-content">
          <span class="stat-label">明星产品</span>
          <span class="stat-value">{{ stats.starProduct || '-' }}</span>
        </div>
      </div>
      <div class="stat-item">
        <div class="stat-icon">
          <el-icon><TrendCharts /></el-icon>
        </div>
        <div class="stat-content">
          <span class="stat-label">TOP3 贡献</span>
          <span class="stat-value">{{ formatPercent(pareto.top3Contribution, 0) }}</span>
        </div>
      </div>
      <div class="stat-item">
        <div class="stat-icon warning">
          <el-icon><Warning /></el-icon>
        </div>
        <div class="stat-content">
          <span class="stat-label">长尾产品</span>
          <span class="stat-value">{{ pareto.longTailCount }} 个</span>
        </div>
      </div>
    </div>

    <div class="table-section">
      <div class="section-card">
        <div class="card-header">
          <div class="header-title">
            <el-icon><List /></el-icon>
            <span>详细数据</span>
          </div>
          <div class="header-badge">
            TOP {{ top10.length }}
          </div>
        </div>
        
        <el-table :data="top10" stripe border size="small" class="data-table">
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
          <el-table-column prop="name" label="产品名称" min-width="150" />
          <el-table-column prop="value" label="销售额" width="150" align="right">
            <template #default="{ row }">
              {{ formatMoneyExact(row.value) }}
            </template>
          </el-table-column>
          <el-table-column prop="contribution" label="占比" width="120" align="center">
            <template #default="{ row }">
              <el-progress
                :percentage="parseFloat((row.contribution * 100).toFixed(1))"
                :color="getProgressColor(row.rank)"
                :show-text="true"
                :stroke-width="8"
              />
            </template>
          </el-table-column>
          <el-table-column prop="cumulativeContribution" label="累计占比" width="120" align="center">
            <template #default="{ row }">
              <span :class="{ 'cumulative-warning': row.cumulativeContribution <= 0.8 }">
                {{ formatPercent(row.cumulativeContribution, 0) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="环比" width="100" align="center">
            <template #default="{ row }">
              <span :class="getProductChange(row).isPositive ? 'positive' : (getProductChange(row).text !== '-' && getProductChange(row).text !== '持平' ? 'negative' : '')">
                {{ getProductChange(row).text }}
              </span>
            </template>
          </el-table-column>
        </el-table>

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
  Goods,
  Calendar,
  InfoFilled,
  PieChart,
  Histogram,
  Box,
  Money,
  StarFilled,
  TrendCharts,
  Warning,
  List
} from '@element-plus/icons-vue'
import { useMappingStore } from '../../stores/mapping.js'
import { formatMoney, formatMoneyExact, formatPercent, formatSmartNumber, formatChangeText } from '../../utils/formatters.js'
import { generatePDF } from '../../utils/pdfGeneratorHtml.js'
import { exportExcel } from '../../utils/excelExporter.js'

const mappingStore = useMappingStore()

const pieChartRef = ref(null)
const barChartRef = ref(null)
let pieChart = null
let barChart = null
const exportingPDF = ref(false)

const calculationResult = computed(() => mappingStore.calculationResult)
const previousStats = computed(() => calculationResult.value?.previousStats || null)
const previousTop10 = computed(() => previousStats.value?.top10 || [])
const top10 = computed(() => calculationResult.value?.top10 || [])
const pareto = computed(() => calculationResult.value?.pareto || { top3Contribution: 0, top5Contribution: 0, longTailCount: 0 })
const stats = computed(() => calculationResult.value?.statistics || {
  totalSales: 0,
  totalProducts: 0,
  starProduct: '',
  top1Value: 0,
  top1Contribution: 0,
  period: ''
})

const comparisonData = computed(() => {
  if (!previousStats.value) return null
  return {
    totalSales: formatChangeText(stats.value.totalSales, previousStats.value.totalSales),
    top1Value: formatChangeText(stats.value.top1Value, previousStats.value.top1Value)
  }
})

const diagnosisVersion = ref('simple')

const simpleDiagnosis = computed(() => {
  if (!stats.value.starProduct) return '暂无有效数据'
  const top3Contribution = (pareto.value.top3Contribution * 100).toFixed(0)
  const longTailCount = pareto.value.longTailCount
  if (pareto.value.top3Contribution > 0.75) {
    return `TOP3产品贡献了团队${top3Contribution}%的业绩，销售激励分配可能存在分散。建议评估高贡献产品的激励侧重是否合理，避免销售精力在低价值产品上的无效消耗。`
  }
  return `TOP3产品贡献了团队${top3Contribution}%的业绩，产品业绩分布相对均衡。建议持续关注产品结构合理性，保持激励政策的稳定性。`
})

const professionalDiagnosis = computed(() => {
  if (!stats.value.starProduct) return '暂无有效数据'
  const top3Contribution = (pareto.value.top3Contribution * 100).toFixed(0)
  const threshold = 65
  if (pareto.value.top3Contribution > 0.75) {
    return `基于激励公平理论，产品贡献度与激励资源配置可能存在错配风险。TOP3产品贡献度达${top3Contribution}%，超出健康阈值（${threshold}%），建议评估销售提成体系是否向高价值产品倾斜，提升激励投入产出比。`
  }
  return `基于激励公平理论，产品贡献度分布相对健康。TOP3贡献度为${top3Contribution}%，符合健康阈值（${threshold}%）范围。建议持续优化产品组合策略，保持业绩增长稳定性。`
})

const managementAdvice = computed(() => {
  const advices = []
  if (pareto.value.top3Contribution > 0.65) {
    advices.push('建议评估高贡献产品的激励侧重是否合理，确保销售资源分配与产品贡献度匹配')
  }
  if (pareto.value.longTailCount > stats.value.totalProducts * 0.3) {
    advices.push(`建议关注${pareto.value.longTailCount}个长尾产品的销售情况，评估是否需要调整产品激励策略`)
  }
  if (stats.value.top1Contribution > 0.35) {
    advices.push('建议评估明星产品的激励设计是否足够突出，强化销售主推意愿')
  }
  if (advices.length === 0) {
    advices.push('建议持续关注产品业绩分布，保持当前良好的产品结构发展态势')
  }
  return advices
})

function getProgressColor(rank) {
  if (rank === 1) return '#FFD700'
  if (rank === 2) return '#C0C0C0'
  if (rank === 3) return '#CD7F32'
  return '#667eea'
}

function getProductChange(row) {
  if (!previousTop10.value || previousTop10.value.length === 0) {
    return { text: '-', isPositive: false }
  }
  const prevProduct = previousTop10.value.find(p => p.name === row.name)
  if (!prevProduct) {
    return { text: '-', isPositive: false }
  }
  return formatChangeText(row.value, prevProduct.value)
}

function initCharts() {
  if (!pieChartRef.value || !barChartRef.value) return

  pieChart = echarts.init(pieChartRef.value)
  barChart = echarts.init(barChartRef.value)

  updateCharts()

  window.addEventListener('resize', handleResize)
}

function updateCharts() {
  if (!pieChart || !barChart || top10.value.length === 0) return

  const pieData = top10.value.slice(0, 5).map((item, index) => ({
    name: item.name,
    value: item.value,
    itemStyle: {
      color: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : ['#667eea', '#10b981'][index - 3]
    }
  }))

  const otherValue = stats.value.totalSales - pieData.reduce((sum, item) => sum + item.value, 0)
  if (otherValue > 0) {
    pieData.push({
      name: '其他',
      value: otherValue,
      itemStyle: { color: '#9ca3af' }
    })
  }

  const pieOption = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: { color: '#1f2937' },
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      textStyle: { color: '#4b5563' }
    },
    series: [{
      type: 'pie',
      radius: ['45%', '75%'],
      center: ['40%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 8,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: false
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 14,
          fontWeight: 'bold'
        }
      },
      data: pieData
    }]
  }

  const names = top10.value.map(item => item.name)
  const values = top10.value.map(item => item.value)

  const barOption = {
    grid: {
      left: '3%',
      right: '8%',
      bottom: '3%',
      top: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      axisLabel: {
        formatter: value => formatSmartNumber(value)
      },
      splitLine: {
        lineStyle: { type: 'dashed', color: '#e5e7eb' }
      }
    },
    yAxis: {
      type: 'category',
      data: names.slice().reverse(),
      axisLabel: { fontSize: 13, color: '#374151' },
      axisLine: { lineStyle: { color: '#e5e7eb' } }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: { color: '#1f2937' },
      formatter: function(params) {
        const data = params[0]
        const item = top10.value.find(i => i.name === data.name)
        return `
          <div style="padding: 8px;">
            <div style="font-weight: bold; margin-bottom: 6px; color: #667eea;">${data.name}</div>
            <div style="margin-bottom: 4px;">销售额: <strong>${formatMoneyExact(data.value)}</strong></div>
            <div>占比: ${formatPercent(item?.contribution || 0)}</div>
          </div>
        `
      }
    },
    series: [{
      type: 'bar',
      data: values.slice().reverse().map((value, index) => {
        const rank = values.length - index
        let color
        if (rank === 1) color = new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#FFD700' },
          { offset: 1, color: '#FFA500' }
        ])
        else if (rank === 2) color = new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#C0C0C0' },
          { offset: 1, color: '#A0A0A0' }
        ])
        else if (rank === 3) color = new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#CD7F32' },
          { offset: 1, color: '#B87333' }
        ])
        else color = new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#10b981' },
          { offset: 1, color: '#059669' }
        ])

        return {
          value,
          itemStyle: {
            color,
            borderRadius: [0, 6, 6, 0]
          }
        }
      }),
      barWidth: '55%',
      label: {
        show: true,
        position: 'right',
        formatter: params => formatSmartNumber(params.value),
        fontSize: 12,
        fontWeight: 500,
        color: '#4b5563'
      }
    }]
  }

  pieChart.setOption(pieOption)
  barChart.setOption(barOption)
}

function handleResize() {
  if (pieChart) pieChart.resize()
  if (barChart) barChart.resize()
}

async function downloadChart() {
  if (!pieChart) return

  try {
    const dataUrl = pieChart.getDataURL({
      type: 'png',
      pixelRatio: 2,
      backgroundColor: '#fff'
    })

    if (window.electronAPI?.saveFile) {
      const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '')
      const binaryString = atob(base64Data)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      const result = await window.electronAPI.saveFile({
        buffer: Array.from(bytes),
        filename: `产品盈利分析_${new Date().toISOString().slice(0, 10)}.png`,
        filters: [{ name: 'PNG 图片', extensions: ['png'] }]
      })

      if (!result.success) {
        throw new Error(result.reason || '保存失败')
      }
    } else {
      const link = document.createElement('a')
      link.download = `产品盈利分析_${new Date().toISOString().slice(0, 10)}.png`
      link.href = dataUrl
      link.click()
    }
  } catch (error) {
    console.error('图表下载失败:', error)
    alert(`图表下载失败: ${error.message || '未知错误'}`)
  }
}

watch(() => top10.value, () => {
  updateCharts()
}, { deep: true })

onMounted(() => {
  initCharts()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (pieChart) {
    pieChart.dispose()
    pieChart = null
  }
  if (barChart) {
    barChart.dispose()
    barChart = null
  }
})

async function handleExportPDF() {
  if (!pieChart) return

  exportingPDF.value = true
  try {
    const chartImage = pieChart.getDataURL({
      type: 'png',
      pixelRatio: 2,
      backgroundColor: '#fff'
    })

    await generatePDF('product', calculationResult.value, mappingStore.dateRange, chartImage)
    alert('PDF 报告导出成功！')
  } catch (error) {
    console.error('PDF导出失败:', error)
    alert(`PDF 导出失败: ${error.message || '未知错误'}`)
  } finally {
    exportingPDF.value = false
  }
}

async function handleExportExcel() {
  try {
    const result = await exportExcel(top10.value, `产品盈利分析_${new Date().toISOString().slice(0, 10)}.xlsx`, 'product')
    if (result?.success) {
      alert('Excel 数据导出成功！')
    }
  } catch (error) {
    console.error('Excel导出失败:', error)
    alert(`Excel 导出失败: ${error.message || '未知错误'}`)
  }
}
</script>

<style scoped>
.product-view {
  padding: 24px 0;
}

.view-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding: 0 4px;
}

.header-badge {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 26px;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
}

.header-content {
  flex: 1;
}

.view-title {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 4px 0;
  letter-spacing: -0.5px;
}

.view-subtitle {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.insight-card {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px 24px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.05) 100%);
  border: 1px solid rgba(16, 185, 129, 0.15);
  border-radius: 16px;
  margin-bottom: 24px;
}

.insight-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  flex-shrink: 0;
}

.insight-content {
  flex: 1;
}

.insight-content.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  color: #9ca3af;
}

.insight-text {
  font-size: 15px;
  line-height: 1.8;
  color: #4b5563;
  margin: 0;
}

.highlight {
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 6px;
}

.highlight.total {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1e40af;
}

.highlight.star {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
}

.highlight.amount {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1e40af;
}

.highlight.percent {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #065f46;
}

.highlight.contribution {
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  color: #3730a3;
}

.highlight.warning {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #991b1b;
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
  border-color: #10b981;
  color: #10b981;
}

.tab-btn.active {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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

.insight-card .insight-icon {
  display: none;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 24px;
}

.section-card {
  background: white;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  height: 100%;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  border-bottom: 1px solid #e5e7eb;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
}

.header-badge {
  padding: 4px 12px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.chart-container {
  width: 100%;
  height: 380px;
  padding: 16px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px;
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  font-size: 24px;
}

.stat-icon.gold {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #d97706;
}

.stat-icon.highlight {
  background: linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%);
  color: #f59e0b;
}

.stat-icon.warning {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #dc2626;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
}

.table-section {
  margin-bottom: 24px;
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

.cumulative-warning {
  color: #059669;
  font-weight: 600;
}

.action-bar {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 20px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.dm-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
  outline: none;
}

.dm-btn-secondary {
  background: white;
  color: #4b5563;
  border: 1px solid #e5e7eb;
}

.dm-btn-secondary:hover {
  background: #f9fafb;
  border-color: #d1d5db;
  transform: translateY(-1px);
}

.dm-btn-primary {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
}

.dm-btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.5);
}

.dm-btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.empty-state {
  padding: 60px 0;
}

@media (max-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .chart-container {
    height: 350px;
  }
}

@media (max-width: 768px) {
  .view-header {
    flex-direction: column;
    text-align: center;
  }

  .insight-card {
    flex-direction: column;
    text-align: center;
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

  .stats-row {
    grid-template-columns: 1fr;
  }

  .action-bar {
    flex-direction: column;
  }

  .dm-btn {
    width: 100%;
  }
}
</style>
