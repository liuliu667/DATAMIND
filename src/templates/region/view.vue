<template>
  <div class="region-view" v-if="calculationResult">
    <!-- 数据洞察 -->
    <div class="insight-panel">
      <div class="panel-header">
        <div class="header-title">
          <el-icon class="title-icon"><MapLocation /></el-icon>
          <div class="title-text">
            <span class="main-title">数据洞察</span>
            <span class="subtitle">数据时间范围：{{ stats.period }}</span>
          </div>
        </div>
        <div class="insight-theory">依据：区域团队配置理论</div>
      </div>
      <div class="panel-body">
        <div v-if="stats.totalRegions > 0" class="insight-text">
          <div class="insight-highlight">
            <span class="highlight-name">{{ stats.topRegion }}</span>
            <span class="highlight-label">区贡献度最高，占</span>
            <span class="highlight-value">{{ formatPercent(stats.topContribution, 0) }}</span>
            <template v-if="comparisonData && comparisonData.totalSales.value !== null">
              (<span :class="comparisonData.totalSales.isPositive ? 'positive' : 'negative'">{{ comparisonData.totalSales.text }}</span>)
            </template>
          </div>
          <div class="insight-detail">
            {{ stats.bottomRegion }} 仅占 {{ formatPercent(stats.bottomContribution, 0) }}。
            <span :class="['concentration-tag', stats.concentration]">
              {{ stats.concentration === 'high' ? '市场高度集中' : '市场分布均衡' }}
            </span>
          </div>
        </div>
        <el-empty v-else description="暂无有效数据" />
      </div>
    </div>

    <!-- 专业诊断 -->
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

    <!-- 管理建议 -->
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

    <!-- 免责声明 -->
    <div class="disclaimer-card">
      <p>⚠️ 本诊断基于人力资源绩效管理理论及数据统计分析，仅供参考，不构成决策依据。</p>
    </div>

    <!-- 图表区域 -->
    <div class="dashboard-grid">
      <div class="chart-section">
        <div class="section-card">
          <div class="card-header">
            <div class="header-title">
              <el-icon><PieChart /></el-icon>
              <span>地区销售占比</span>
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
              <span>地区销售排名</span>
            </div>
          </div>
          <div ref="barChartRef" class="chart-container"></div>
        </div>
      </div>
    </div>

    <!-- 统计指标 -->
    <div class="stats-row">
      <div class="stat-item highlight">
        <div class="stat-icon gold">
          <el-icon><Trophy /></el-icon>
        </div>
        <div class="stat-content">
          <span class="stat-label">冠军地区</span>
          <span class="stat-value">{{ stats.topRegion || '-' }}</span>
        </div>
      </div>
      <div class="stat-item">
        <div class="stat-icon">
          <el-icon><OfficeBuilding /></el-icon>
        </div>
        <div class="stat-content">
          <span class="stat-label">地区总数</span>
          <span class="stat-value">{{ stats.totalRegions }} 个</span>
        </div>
      </div>
      <div class="stat-item">
        <div class="stat-icon">
          <el-icon><TrendCharts /></el-icon>
        </div>
        <div class="stat-content">
          <span class="stat-label">TOP1 贡献</span>
          <span class="stat-value">{{ formatPercent(stats.topContribution, 0) }}</span>
        </div>
      </div>
      <div class="stat-item warning">
        <div class="stat-icon">
          <el-icon><Warning /></el-icon>
        </div>
        <div class="stat-content">
          <span class="stat-label">末位地区</span>
          <span class="stat-value">{{ stats.bottomRegion || '-' }}</span>
        </div>
      </div>
    </div>

    <!-- 详细数据表格 -->
    <div class="table-section">
      <div class="section-card">
        <div class="card-header">
          <div class="header-title">
            <el-icon><List /></el-icon>
            <span>详细数据</span>
          </div>
        </div>
        <div class="table-container">
          <el-table :data="regions" stripe border size="small" class="data-table">
            <el-table-column prop="rank" label="排名" width="80" align="center">
              <template #default="{ row }">
                <div class="rank-cell">
                  <div v-if="row.rank <= 3" class="rank-badge" :class="`rank-${row.rank}`">
                    <el-icon v-if="row.rank === 1"><Trophy /></el-icon>
                    <el-icon v-else-if="row.rank === 2"><Medal /></el-icon>
                    <el-icon v-else><Star /></el-icon>
                  </div>
                  <span v-else class="rank-number">{{ row.rank }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="地区" min-width="120">
              <template #default="{ row }">
                <div class="region-name">
                  <el-icon><Location /></el-icon>
                  <span>{{ row.name }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="value" label="销售额" width="150" align="right">
              <template #default="{ row }">
                <span class="sales-value">{{ formatMoneyExact(row.value) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="contribution" label="占比" width="150" align="center">
              <template #default="{ row }">
                <div class="progress-cell">
                  <el-progress
                    :percentage="parseFloat((row.contribution * 100).toFixed(1))"
                    :color="getProgressColor(row.rank)"
                    :show-text="false"
                    :stroke-width="8"
                    class="contribution-progress"
                  />
                  <span class="progress-text">{{ formatPercent(row.contribution) }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="与TOP1差距" width="130" align="right">
              <template #default="{ row }">
                <span v-if="row.rank === 1" class="gap-leader">领先</span>
                <span v-else class="gap-value">
                  -{{ formatPercent((regions[0]?.value - row.value) / regions[0]?.value, 0) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="环比" width="100" align="center">
              <template #default="{ row }">
                <span :class="getRegionChange(row).isPositive ? 'positive' : (getRegionChange(row).text !== '-' && getRegionChange(row).text !== '持平' ? 'negative' : '')">
                  {{ getRegionChange(row).text }}
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
        </div>

        <div class="action-row">
          <el-button type="primary" size="large" @click="handleExportPDF" :loading="exportingPDF" class="export-btn">
            <el-icon><Document /></el-icon>
            <span>导出 PDF 报告</span>
          </el-button>
          <el-button size="large" @click="handleExportExcel" class="export-btn secondary">
            <el-icon><Download /></el-icon>
            <span>下载完整数据</span>
          </el-button>
        </div>
      </div>
    </div>

    <ProductDistributionModal
      v-model="showProductModal"
      :main-dimension-name="selectedRegion?.name || ''"
      main-dimension-label="地区"
      :total-value="selectedRegion?.value || 0"
      :products="selectedRegion?.allProducts || []"
    />
  </div>
  <el-empty v-else description="暂无数据" />
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import * as echarts from 'echarts'
import {
  Download,
  Document,
  MapLocation,
  PieChart,
  Histogram,
  Trophy,
  OfficeBuilding,
  TrendCharts,
  Warning,
  List,
  Location,
  Medal,
  Star,
  InfoFilled
} from '@element-plus/icons-vue'
import { useMappingStore } from '../../stores/mapping.js'
import { formatMoney, formatMoneyExact, formatPercent, formatSmartNumber, formatChangeText } from '../../utils/formatters.js'
import { generatePDF } from '../../utils/pdfGeneratorHtml.js'
import { exportExcel } from '../../utils/excelExporter.js'
import ProductDistributionModal from '../../components/ProductDistributionModal.vue'

const mappingStore = useMappingStore()

const pieChartRef = ref(null)
const barChartRef = ref(null)
let pieChart = null
let barChart = null
const exportingPDF = ref(false)

// 产品分布模态框
const showProductModal = ref(false)
const selectedRegion = ref(null)

function showProductDetail(row) {
  selectedRegion.value = row
  showProductModal.value = true
}

const calculationResult = computed(() => mappingStore.calculationResult)
const regions = computed(() => calculationResult.value?.regions || [])
const hasProductData = computed(() => calculationResult.value?.hasProductData || false)
const previousStats = computed(() => calculationResult.value?.previousStats || null)
const previousRegions = computed(() => previousStats.value?.regions || [])
const comparisonData = computed(() => {
  if (!previousStats.value) return null
  return {
    totalSales: formatChangeText(stats.value.totalSales, previousStats.value.totalSales)
  }
})
const stats = computed(() => calculationResult.value?.statistics || {
  totalRegions: 0,
  totalSales: 0,
  topRegion: '',
  topContribution: 0,
  bottomRegion: '',
  bottomContribution: 0,
  concentration: 'low',
  period: ''
})

const diagnosisVersion = ref('simple')

const simpleDiagnosis = computed(() => {
  if (stats.value.totalRegions === 0) return '暂无有效数据'
  const topRegion = stats.value.topRegion
  const topContribution = (stats.value.topContribution * 100).toFixed(0)
  const concentration = stats.value.concentration
  if (concentration === 'high') {
    return `${topRegion}地区贡献了团队${topContribution}%的业绩，区域贡献度分布存在失衡。建议评估低产区域的人员配置是否合理，以及销售人员能力与区域市场的匹配度。`
  }
  return `${topRegion}地区贡献了团队${topContribution}%的业绩，区域贡献度分布相对均衡。建议持续关注各区域协调发展，保持团队稳定发展。`
})

const professionalDiagnosis = computed(() => {
  if (stats.value.totalRegions === 0) return '暂无有效数据'
  const topRegion = stats.value.topRegion
  const topContribution = (stats.value.topContribution * 100).toFixed(0)
  const concentration = stats.value.concentration
  const threshold = 45
  if (concentration === 'high') {
    return `基于区域团队配置理论，区域贡献度分布存在显著失衡。TOP区域贡献度达${topContribution}%，超出健康阈值（${threshold}%），建议从HR视角评估低产区域人员配置合理性，以及销售人员能力模型与区域市场特征的匹配度。`
  }
  return `基于区域团队配置理论，区域贡献度分布相对健康。TOP区域贡献度为${topContribution}%，符合健康阈值（${threshold}%）范围。建议持续优化区域团队配置，保持协调发展态势。`
})

const managementAdvice = computed(() => {
  const advices = []
  if (stats.value.concentration === 'high') {
    advices.push('建议评估低产区域的人员配置是否合理，优化区域人力资源分配')
  }
  if (stats.value.totalRegions > 2) {
    const lowRegions = stats.value.totalRegions - 1
    advices.push(`建议关注其他${lowRegions}个区域的发展潜力，评估是否需要加强区域团队建设`)
  }
  if (stats.value.topContribution > 0.55) {
    advices.push('建议评估头部区域的销售团队配置是否充足，避免资源过载')
  }
  if (advices.length === 0) {
    advices.push('建议持续关注区域协调发展，保持当前良好的团队发展态势')
  }
  return advices
})

function getProgressColor(rank) {
  if (rank === 1) return ['#fbbf24', '#f59e0b']
  if (rank === 2) return ['#94a3b8', '#64748b']
  if (rank === 3) return ['#f97316', '#ea580c']
  return ['#3b82f6', '#2563eb']
}

function getRegionChange(row) {
  if (!previousRegions.value || previousRegions.value.length === 0) {
    return { text: '-', isPositive: false }
  }
  const prevRegion = previousRegions.value.find(r => r.name === row.name)
  if (!prevRegion) {
    return { text: '-', isPositive: false }
  }
  return formatChangeText(row.value, prevRegion.value)
}

function initCharts() {
  if (!pieChartRef.value || !barChartRef.value) return

  pieChart = echarts.init(pieChartRef.value)
  barChart = echarts.init(barChartRef.value)

  updateCharts()

  window.addEventListener('resize', handleResize)
}

function updateCharts() {
  if (!pieChart || !barChart || regions.value.length === 0) return

  const displayRegions = regions.value.length > 8 ? regions.value.slice(0, 7) : regions.value
  const pieData = displayRegions.map((item, index) => ({
    name: item.name,
    value: item.value,
    itemStyle: {
      color: index === 0 
        ? new echarts.graphic.LinearGradient(0, 0, 1, 1, [
            { offset: 0, color: '#fbbf24' },
            { offset: 1, color: '#f59e0b' }
          ])
        : index === 1
        ? new echarts.graphic.LinearGradient(0, 0, 1, 1, [
            { offset: 0, color: '#94a3b8' },
            { offset: 1, color: '#64748b' }
          ])
        : index === 2
        ? new echarts.graphic.LinearGradient(0, 0, 1, 1, [
            { offset: 0, color: '#f97316' },
            { offset: 1, color: '#ea580c' }
          ])
        : new echarts.graphic.LinearGradient(0, 0, 1, 1, [
            { offset: 0, color: '#3b82f6' },
            { offset: 1, color: '#2563eb' }
          ])
    }
  }))

  const otherValue = stats.value.totalSales - pieData.reduce((sum, item) => sum + item.value, 0)
  if (otherValue > 0 && regions.value.length > 8) {
    pieData.push({
      name: '其他',
      value: otherValue,
      itemStyle: { 
        color: new echarts.graphic.LinearGradient(0, 0, 1, 1, [
          { offset: 0, color: '#cbd5e1' },
          { offset: 1, color: '#94a3b8' }
        ])
      }
    })
  }

  const pieOption = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      textStyle: { color: '#1e293b' },
      formatter: params => `
        <div style="padding: 8px;">
          <div style="font-weight: 600; margin-bottom: 4px; color: #1e293b;">${params.name}</div>
          <div style="color: #64748b;">销售额: ${formatMoneyExact(params.value)}</div>
          <div style="color: #3b82f6; font-weight: 500;">占比: ${params.percent}%</div>
        </div>
      `
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      itemGap: 12,
      textStyle: {
        fontSize: 12,
        color: '#475569'
      }
    },
    series: [{
      type: 'pie',
      radius: ['45%', '75%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 8,
        borderColor: '#fff',
        borderWidth: 3
      },
      label: {
        show: false
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 14,
          fontWeight: 'bold',
          formatter: '{b}\n{d}%'
        },
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.2)'
        }
      },
      labelLine: {
        show: false
      },
      data: pieData,
      animationType: 'scale',
      animationEasing: 'elasticOut',
      animationDelay: function (idx) {
        return Math.random() * 200
      }
    }]
  }

  const names = regions.value.map(item => item.name)
  const values = regions.value.map(item => item.value)

  const barOption = {
    grid: {
      left: '3%',
      right: '8%',
      bottom: '3%',
      top: '5%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      axisLabel: {
        formatter: value => formatSmartNumber(value),
        color: '#64748b'
      },
      splitLine: {
        lineStyle: { 
          type: 'dashed',
          color: '#e2e8f0'
        }
      },
      axisLine: {
        lineStyle: { color: '#e2e8f0' }
      }
    },
    yAxis: {
      type: 'category',
      data: names.slice().reverse(),
      axisLabel: { 
        fontSize: 12,
        color: '#475569',
        fontWeight: 500
      },
      axisLine: {
        lineStyle: { color: '#e2e8f0' }
      },
      axisTick: {
        show: false
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { 
        type: 'shadow',
        shadowStyle: {
          color: 'rgba(59, 130, 246, 0.1)'
        }
      },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      textStyle: { color: '#1e293b' },
      formatter: function(params) {
        const data = params[0]
        const item = regions.value.find(i => i.name === data.name)
        return `
          <div style="padding: 8px;">
            <div style="font-weight: 600; margin-bottom: 4px; color: #1e293b;">${data.name}</div>
            <div style="color: #64748b;">销售额: ${formatMoneyExact(data.value)}</div>
            <div style="color: #3b82f6; font-weight: 500;">占比: ${formatPercent(item?.contribution || 0)}</div>
          </div>
        `
      }
    },
    series: [{
      type: 'bar',
      data: values.slice().reverse().map((value, index) => {
        const rank = values.length - index
        let colorStops
        if (rank === 1) {
          colorStops = [
            { offset: 0, color: '#fbbf24' },
            { offset: 1, color: '#f59e0b' }
          ]
        } else if (rank === 2) {
          colorStops = [
            { offset: 0, color: '#94a3b8' },
            { offset: 1, color: '#64748b' }
          ]
        } else if (rank === 3) {
          colorStops = [
            { offset: 0, color: '#f97316' },
            { offset: 1, color: '#ea580c' }
          ]
        } else {
          colorStops = [
            { offset: 0, color: '#3b82f6' },
            { offset: 1, color: '#2563eb' }
          ]
        }

        return {
          value,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, colorStops),
            borderRadius: [0, 6, 6, 0]
          }
        }
      }),
      barWidth: '60%',
      label: {
        show: true,
        position: 'right',
        formatter: params => formatSmartNumber(params.value),
        color: '#475569',
        fontWeight: 500
      },
      animationDuration: 1000,
      animationEasing: 'cubicOut'
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
        filename: `地区销售分布_${new Date().toISOString().slice(0, 10)}.png`,
        filters: [{ name: 'PNG 图片', extensions: ['png'] }]
      })

      if (!result.success) {
        throw new Error(result.reason || '保存失败')
      }
    } else {
      const link = document.createElement('a')
      link.download = `地区销售分布_${new Date().toISOString().slice(0, 10)}.png`
      link.href = dataUrl
      link.click()
    }
  } catch (error) {
    console.error('图表下载失败:', error)
    alert(`图表下载失败: ${error.message || '未知错误'}`)
  }
}

watch(() => regions.value, () => {
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

    await generatePDF('region', calculationResult.value, mappingStore.dateRange, chartImage)
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
    const result = await exportExcel(regions.value, `地区销售分布_${new Date().toISOString().slice(0, 10)}.xlsx`, 'region')
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
.region-view {
  padding: 8px 0;
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 洞察面板 */
.insight-panel {
  background: linear-gradient(135deg, #f0f9ff 0%, #fff 100%);
  border: 1px solid #e0f2fe;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  transition: all 0.3s ease;
}

.insight-panel:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04);
  transform: translateY(-2px);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 16px;
}

.title-icon {
  font-size: 32px;
  color: #0ea5e9;
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.title-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.main-title {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.5px;
}

.subtitle {
  font-size: 13px;
  color: #64748b;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: 10px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.panel-body {
  padding: 8px 0;
}

.insight-text {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.insight-highlight {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.highlight-name {
  font-size: 20px;
  font-weight: 700;
  color: #0ea5e9;
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.highlight-label {
  font-size: 15px;
  color: #475569;
}

.highlight-value {
  font-size: 18px;
  font-weight: 700;
  color: #f59e0b;
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.positive {
  color: #ef4444;
  font-weight: 600;
}

.negative {
  color: #22c55e;
  font-weight: 600;
}

.insight-detail {
  font-size: 14px;
  color: #64748b;
  line-height: 1.6;
}

.concentration-tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  margin-left: 8px;
}

.concentration-tag.high {
  background: #fef3c7;
  color: #d97706;
}

.concentration-tag.low {
  background: #d1fae5;
  color: #059669;
}

.insight-advice {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 10px;
  font-size: 13px;
  color: #64748b;
  line-height: 1.6;
}

.insight-advice .el-icon {
  color: #3b82f6;
  font-size: 16px;
  margin-top: 2px;
  flex-shrink: 0;
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
  border-color: #0ea5e9;
  color: #0ea5e9;
}

.tab-btn.active {
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
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

/* 仪表板网格 */
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.chart-section {
  animation: slideUp 0.5s ease-out;
  animation-fill-mode: both;
}

.chart-section:nth-child(1) {
  animation-delay: 0.1s;
}

.chart-section:nth-child(2) {
  animation-delay: 0.2s;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.section-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  height: 100%;
}

.section-card:hover {
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.02);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
}

.card-header .header-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
}

.card-header .header-title .el-icon {
  font-size: 18px;
  color: #3b82f6;
}

.chart-container {
  width: 100%;
  height: 380px;
  padding: 16px;
}

/* 统计行 */
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
  padding: 18px 20px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  animation: slideUp 0.5s ease-out;
  animation-fill-mode: both;
}

.stat-item:nth-child(1) { animation-delay: 0.1s; }
.stat-item:nth-child(2) { animation-delay: 0.15s; }
.stat-item:nth-child(3) { animation-delay: 0.2s; }
.stat-item:nth-child(4) { animation-delay: 0.25s; }

.stat-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08);
}

.stat-item.highlight {
  background: linear-gradient(135deg, #fffbeb 0%, #fff 100%);
  border-color: #fcd34d;
}

.stat-item.warning {
  background: linear-gradient(135deg, #fef2f2 0%, #fff 100%);
  border-color: #fca5a5;
}

.stat-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  color: #3b82f6;
  font-size: 20px;
  flex-shrink: 0;
}

.stat-icon.gold {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #d97706;
}

.stat-item.warning .stat-icon {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #dc2626;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.stat-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}

.stat-value {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 表格区域 */
.table-section {
  animation: slideUp 0.5s ease-out 0.3s both;
}

.table-container {
  padding: 20px;
}

.data-table {
  border-radius: 12px;
  overflow: hidden;
}

.data-table :deep(.el-table__header) {
  background: #f8fafc;
}

.data-table :deep(.el-table__header th) {
  background: #f8fafc;
  font-weight: 600;
  color: #475569;
  padding: 14px 12px;
}

.data-table :deep(.el-table__row) {
  transition: all 0.2s ease;
}

.data-table :deep(.el-table__row:hover) {
  background: #f8fafc;
}

.rank-cell {
  display: flex;
  align-items: center;
  justify-content: center;
}

.rank-badge {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 16px;
}

.rank-badge.rank-1 {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #d97706;
  box-shadow: 0 2px 8px rgba(251, 191, 36, 0.4);
}

.rank-badge.rank-2 {
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  color: #64748b;
  box-shadow: 0 2px 8px rgba(148, 163, 184, 0.4);
}

.rank-badge.rank-3 {
  background: linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%);
  color: #c2410c;
  box-shadow: 0 2px 8px rgba(251, 146, 60, 0.4);
}

.rank-number {
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
}

.region-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: #334155;
}

.region-name .el-icon {
  color: #3b82f6;
}

.sales-value {
  font-weight: 600;
  color: #0f172a;
}

.progress-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.contribution-progress {
  flex: 1;
}

.progress-text {
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  min-width: 45px;
}

.gap-leader {
  color: #10b981;
  font-weight: 600;
}

.gap-value {
  color: #ef4444;
  font-weight: 600;
}

/* 操作行 */
.action-row {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 24px;
  border-top: 1px solid #f1f5f9;
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 28px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
}

.export-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.export-btn.secondary {
  border: 1px solid #e2e8f0;
  color: #475569;
}

.export-btn.secondary:hover {
  border-color: #3b82f6;
  color: #3b82f6;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

/* 响应式 */
@media (max-width: 1200px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .insight-panel {
    padding: 16px;
  }
  
  .panel-header {
    flex-direction: column;
    gap: 16px;
  }
  
  .stats-row {
    grid-template-columns: 1fr;
  }
  
  .chart-container {
    height: 300px;
  }
  
  .action-row {
    flex-direction: column;
    align-items: stretch;
  }

  .panel-header {
    flex-direction: column;
    gap: 12px;
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
</style>
