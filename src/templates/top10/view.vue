<template>
  <div class="top10-view" v-if="calculationResult">
    <div class="view-header">
      <div class="header-badge">
        <el-icon><Trophy /></el-icon>
      </div>
      <div class="header-content">
        <h2 class="view-title">员工业绩排行榜</h2>
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
          依据：帕累托法则、绩效分布理论
        </div>
      </div>
      <div v-if="stats.top1Name" class="insight-content">
        <p class="insight-text">
          本月销售冠军是 <span class="highlight champion">{{ stats.top1Name }}</span>，
          销售额 <span class="highlight amount">{{ formatMoney(stats.top1Value) }}</span>，
          超出团队均值 <span class="highlight percent">{{ formatPercent(stats.top1VsAvg, 0) }}</span>，
          为团队贡献 <span class="highlight contribution">{{ formatPercent(stats.top1Contribution, 1) }}</span> 的业绩。
          团队总销售额 {{ formatMoney(stats.totalSales) }}<template v-if="comparisonData && comparisonData.totalSales.value !== null">(<span :class="comparisonData.totalSales.isPositive ? 'positive' : 'negative'">{{ comparisonData.totalSales.text }}</span>)</template>，人均 {{ formatMoney(stats.avgSales) }}<template v-if="comparisonData && comparisonData.avgSales.value !== null">(<span :class="comparisonData.avgSales.isPositive ? 'positive' : 'negative'">{{ comparisonData.avgSales.text }}</span>)</template>。
          <span v-if="stats.totalEmployees < 10">
            本月共有 {{ stats.totalEmployees }} 人产生业绩。
          </span>
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
              <el-icon><Histogram /></el-icon>
              <span>业绩分布图</span>
            </div>
          </div>
          <div ref="chartRef" class="chart-container"></div>
        </div>
      </div>

      <div class="stats-section">
        <div class="section-card">
          <div class="card-header">
            <div class="header-title">
              <el-icon><DataAnalysis /></el-icon>
              <span>关键指标</span>
            </div>
          </div>
          <div class="stats-grid">
            <div class="stat-card champion">
              <div class="stat-icon">
                <el-icon><Medal /></el-icon>
              </div>
              <div class="stat-content">
                <span class="stat-label">冠军业绩</span>
                <span class="stat-value">{{ formatMoney(stats.top1Value) }}</span>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">
                <el-icon><User /></el-icon>
              </div>
              <div class="stat-content">
                <span class="stat-label">团队均值</span>
                <span class="stat-value">{{ formatMoney(stats.avgSales) }}</span>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">
                <el-icon><ArrowUp /></el-icon>
              </div>
              <div class="stat-content">
                <span class="stat-label">上榜门槛</span>
                <span class="stat-value">{{ top10.length > 0 ? formatMoney(top10[top10.length - 1]?.value) : '-' }}</span>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">
                <el-icon><UserFilled /></el-icon>
              </div>
              <div class="stat-content">
                <span class="stat-label">团队人数</span>
                <span class="stat-value">{{ stats.totalEmployees }} 人</span>
              </div>
            </div>
          </div>
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
            共 {{ allEmployees.length }} 人
          </div>
        </div>
        
        <el-table 
          :data="paginatedData" 
          stripe 
          border 
          size="small" 
          class="data-table"
          ref="tableRef" 
          v-loading="loading"
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
          <el-table-column prop="contribution" label="占比" width="150" align="center">
            <template #default="{ row }">
              <el-progress
                :percentage="parseFloat((row.contribution * 100).toFixed(1))"
                :color="getProgressColor(row.rank)"
                :show-text="true"
                :stroke-width="8"
              />
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
          <el-table-column v-if="hasProductData" label="产品分布" min-width="140" align="left">
            <template #default="{ row }">
              <div 
                class="product-distribution-cell" 
                :class="{ 'clickable': row.allProducts && row.allProducts.length > 0 }"
                @click="row.allProducts && row.allProducts.length > 0 && showProductDetail(row)"
              >
                <template v-if="row.topProducts && row.topProducts.length > 0">
                  <span class="top-product">{{ row.topProducts[0].name }}</span>
                  <span v-if="row.allProducts && row.allProducts.length > 1" class="product-count">
                    等{{ row.allProducts.length }}种
                  </span>
                </template>
                <span v-else class="no-product">-</span>
              </div>
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

    <ProductDistributionModal
      v-model="showProductModal"
      :main-dimension-name="selectedEmployee?.name || ''"
      main-dimension-label="员工"
      :total-value="selectedEmployee?.value || 0"
      :products="selectedEmployee?.allProducts || []"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import * as echarts from 'echarts'
import {
  Download,
  Document,
  Trophy,
  Calendar,
  InfoFilled,
  Histogram,
  DataAnalysis,
  Medal,
  User,
  ArrowUp,
  UserFilled,
  List,
  TrendCharts
} from '@element-plus/icons-vue'
import { useMappingStore } from '../../stores/mapping.js'
import { formatMoney, formatMoneyExact, formatPercent, formatSmartNumber, formatChangeText } from '../../utils/formatters.js'
import { generatePDF } from '../../utils/pdfGeneratorHtml.js'
import { exportExcel } from '../../utils/excelExporter.js'
import ProductDistributionModal from '../../components/ProductDistributionModal.vue'

const mappingStore = useMappingStore()

const chartRef = ref(null)
const tableRef = ref(null)
let chart = null
const exportingPDF = ref(false)

const calculationResult = computed(() => mappingStore.calculationResult)
const top10 = computed(() => calculationResult.value?.top10 || [])
const allEmployees = computed(() => calculationResult.value?.allEmployees || [])
const hasProductData = computed(() => calculationResult.value?.hasProductData || false)
const previousStats = computed(() => calculationResult.value?.previousStats || null)
const previousAllEmployees = computed(() => previousStats.value?.allEmployees || [])
const stats = computed(() => calculationResult.value?.statistics || {
  totalSales: 0,
  totalEmployees: 0,
  top1Name: '',
  top1Value: 0,
  avgSales: 0,
  top1Contribution: 0,
  top1VsAvg: 0
})

const comparisonData = computed(() => {
  if (!previousStats.value) return null
  return {
    totalSales: formatChangeText(stats.value.totalSales, previousStats.value.totalSales),
    top1Value: formatChangeText(stats.value.top1Value, previousStats.value.top1Value),
    avgSales: formatChangeText(stats.value.avgSales, previousStats.value.avgSales)
  }
})

// 分页相关
const currentPage = ref(1)
const pageSize = ref(20)
const loading = ref(false)

// 产品分布模态框
const showProductModal = ref(false)
const selectedEmployee = ref(null)

// 诊断版本切换
const diagnosisVersion = ref('simple')

// 通俗理解版诊断
const simpleDiagnosis = computed(() => {
  if (!stats.value.top1Name) return '暂无有效数据'
  const top1Contribution = (stats.value.top1Contribution * 100).toFixed(0)
  if (stats.value.top1Contribution > 0.45) {
    return `团队业绩高度集中于头部销售人员，TOP1贡献度达${top1Contribution}%，存在过度依赖个别人员的风险。建议关注头部员工的成功经验总结与尾部员工的业绩改进。`
  }
  return `团队业绩分布相对均衡，TOP1贡献度为${top1Contribution}%，头部员工带动作用明显。建议关注中腰部员工的成长空间，保持团队稳定性。`
})

// HR专业版诊断
const professionalDiagnosis = computed(() => {
  if (!stats.value.top1Name) return '暂无有效数据'
  const top1Contribution = (stats.value.top1Contribution * 100).toFixed(0)
  const threshold = 35
  if (stats.value.top1Contribution > 0.45) {
    return `基于帕累托法则分析，团队绩效分布呈现显著偏态。TOP1销售人员贡献度达${top1Contribution}%，超出健康阈值（${threshold}%），存在"关键人依赖风险"。建议实施分层激励策略，强化中腰部员工培养，降低团队运营风险。`
  }
  return `基于帕累托法则分析，团队绩效分布相对健康。TOP1贡献度为${top1Contribution}%，符合健康阈值（${threshold}%）范围。建议持续关注团队稳定性，强化中腰部员工能力建设。`
})

// 管理建议
const managementAdvice = computed(() => {
  const advices = []
  if (stats.value.top1Contribution > 0.35) {
    advices.push('建议对头部员工进行成功经验总结，形成可复制的方法论')
  }
  if (stats.value.totalEmployees > 3) {
    const belowAvgCount = stats.value.totalEmployees - top10.value.filter(e => e.value >= stats.value.avgSales).length
    if (belowAvgCount > 0) {
      advices.push(`建议对${belowAvgCount}名业绩偏低人员进行一对一沟通，明确改进方向`)
    }
  }
  if (stats.value.top1VsAvg > 2) {
    advices.push('建议评估现有激励体系是否足够激励中腰部员工成长')
  }
  if (advices.length === 0) {
    advices.push('建议持续关注团队绩效分布，保持当前良好的发展态势')
  }
  return advices
})

function showProductDetail(row) {
  selectedEmployee.value = row
  showProductModal.value = true
}

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

function getProgressColor(rank) {
  if (rank === 1) return '#FFD700'
  if (rank === 2) return '#C0C0C0'
  if (rank === 3) return '#CD7F32'
  return '#667eea'
}

function initChart() {
  if (!chartRef.value) return

  chart = echarts.init(chartRef.value)
  updateChart()

  window.addEventListener('resize', handleResize)
}

function updateChart() {
  if (!chart || top10.value.length === 0) return

  const names = top10.value.map(item => item.name)
  const values = top10.value.map(item => item.value)

  const option = {
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
        lineStyle: {
          type: 'dashed',
          color: '#e5e7eb'
        }
      }
    },
    yAxis: {
      type: 'category',
      data: names.slice().reverse(),
      axisLabel: {
        fontSize: 13,
        color: '#374151'
      },
      axisLine: {
        lineStyle: {
          color: '#e5e7eb'
        }
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: {
        color: '#1f2937'
      },
      formatter: function(params) {
        const data = params[0]
        const item = top10.value.find(i => i.name === data.name)
        if (!item) return data.name

        return `
          <div style="padding: 8px;">
            <div style="font-weight: bold; margin-bottom: 6px; color: #667eea;">${data.name}</div>
            <div style="margin-bottom: 4px;">销售额: <strong>${formatMoneyExact(data.value)}</strong></div>
            <div style="margin-bottom: 4px;">占比: ${formatPercent(item.contribution)}</div>
            <div>排名: 第${item.rank}名</div>
          </div>
        `
      }
    },
    series: [{
      type: 'bar',
      data: values.slice().reverse().map((value, index) => {
        const rank = values.length - index
        let color = '#667eea'
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
          { offset: 0, color: '#667eea' },
          { offset: 1, color: '#764ba2' }
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

  chart.setOption(option)
}

function handleResize() {
  if (chart) {
    chart.resize()
  }
}

async function downloadChart() {
  if (!chart) return

  try {
    const dataUrl = chart.getDataURL({
      type: 'png',
      pixelRatio: 2,
      backgroundColor: '#fff'
    })

    // 通过 IPC 发送到主进程保存
    if (window.electronAPI?.saveFile) {
      // 从 data URL 中提取 base64 数据并转换为 buffer
      const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '')
      const binaryString = atob(base64Data)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      const result = await window.electronAPI.saveFile({
        buffer: Array.from(bytes),
        filename: `员工业绩排行榜_${new Date().toISOString().slice(0, 10)}.png`,
        filters: [{ name: 'PNG 图片', extensions: ['png'] }]
      })

      if (!result.success) {
        throw new Error(result.reason || '保存失败')
      }
    } else {
      // 降级处理：浏览器环境
      const link = document.createElement('a')
      link.download = `员工业绩排行榜_${new Date().toISOString().slice(0, 10)}.png`
      link.href = dataUrl
      link.click()
    }
  } catch (error) {
    console.error('图表下载失败:', error)
    alert(`图表下载失败: ${error.message || '未知错误'}`)
  }
}

watch(() => top10.value, () => {
  updateChart()
}, { deep: true })

onMounted(() => {
  initChart()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (chart) {
    chart.dispose()
    chart = null
  }
})

async function handleExportPDF() {
  if (!chart) return

  exportingPDF.value = true
  try {
    const chartImage = chart.getDataURL({
      type: 'png',
      pixelRatio: 2,
      backgroundColor: '#fff'
    })

    await generatePDF('top10', calculationResult.value, mappingStore.dateRange, chartImage)
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
    const result = await exportExcel(allEmployees.value, `员工业绩排行榜_${new Date().toISOString().slice(0, 10)}.xlsx`, 'top10')
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
.top10-view {
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
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 26px;
  box-shadow: 0 4px 14px rgba(245, 158, 11, 0.4);
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
  padding: 20px 24px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  border: 1px solid rgba(102, 126, 234, 0.15);
  border-radius: 16px;
  margin-bottom: 24px;
}

.insight-icon {
  display: none;
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
}
.highlight.positive {
    color: #ef4444;
    font-weight: 600;
  }
  .highlight.negative {
    color: #22c55e;
    font-weight: 600;
  }
  .highlight {
    padding: 2px 8px;
    border-radius: 6px;
  }
  
  .highlight.champion {
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
  border-color: #667eea;
  color: #667eea;
}

.tab-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

.dashboard-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.chart-container {
  width: 100%;
  height: 400px;
  padding: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  padding: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.stat-card.champion {
  background: linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%);
  border-color: #f59e0b;
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #667eea;
  font-size: 22px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.stat-card.champion .stat-icon {
  color: #f59e0b;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 14px rgba(102, 126, 234, 0.4);
}

.dm-btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
}

.dm-btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.product-distribution-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
}

.product-distribution-cell.clickable {
  cursor: pointer;
  transition: all 0.2s ease;
}

.product-distribution-cell.clickable:hover {
  opacity: 0.8;
}

.product-distribution-cell.clickable:hover .top-product {
  text-decoration: underline;
}

.top-product {
  color: #667eea;
  font-weight: 500;
  font-size: 13px;
  max-width: 90px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-count {
  font-size: 12px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 10px;
  white-space: nowrap;
}

.no-product {
  color: #9ca3af;
}

@media (max-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
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

  .action-bar {
    flex-direction: column;
  }

  .dm-btn {
    width: 100%;
  }
}
</style>
