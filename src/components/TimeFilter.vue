<template>
  <div class="time-filter">
    <div class="filter-header">
      <div class="filter-icon">
        <el-icon><Calendar /></el-icon>
      </div>
      <div class="filter-title">
        <h4>时间范围筛选</h4>
        <p class="filter-subtitle">基于数据实际时间进行筛选</p>
      </div>
    </div>

    <div v-if="dataDateRange" class="data-range-card">
      <div class="range-icon">
        <el-icon><DataLine /></el-icon>
      </div>
      <div class="range-content">
        <span class="range-label">数据时间范围</span>
        <span class="range-value">{{ formatDate(dataDateRange.min) }} 至 {{ formatDate(dataDateRange.max) }}</span>
      </div>
    </div>

    <div class="filter-options">
      <div
        v-for="option in filterOptions"
        :key="option.value"
        class="filter-option"
        :class="{ 'is-active': selectedType === option.value }"
        @click="handleTypeChange(option.value)"
      >
        <div class="option-radio">
          <div class="radio-inner"></div>
        </div>
        <div class="option-content">
          <span class="option-label">{{ option.label }}</span>
          <span v-if="option.description" class="option-desc">{{ option.description }}</span>
        </div>
        <el-icon v-if="selectedType === option.value" class="check-icon"><Check /></el-icon>
      </div>
    </div>

    <div v-if="selectedType === 'custom'" class="custom-range-panel">
      <div class="panel-header">
        <el-icon><Timer /></el-icon>
        <span>自定义日期范围</span>
      </div>
      <div class="date-inputs">
        <div class="date-field">
          <label>开始日期</label>
          <el-date-picker
            v-model="customStart"
            type="date"
            placeholder="选择开始日期"
            format="YYYY-MM-DD"
            value-format="YYYYMMDD"
            class="custom-date-picker"
            @change="handleCustomChange"
          />
        </div>
        <div class="date-separator">
          <div class="sep-line"></div>
          <span>至</span>
          <div class="sep-line"></div>
        </div>
        <div class="date-field">
          <label>结束日期</label>
          <el-date-picker
            v-model="customEnd"
            type="date"
            placeholder="选择结束日期"
            format="YYYY-MM-DD"
            value-format="YYYYMMDD"
            class="custom-date-picker"
            @change="handleCustomChange"
          />
        </div>
      </div>
    </div>

    <div v-if="dateRange.start && dateRange.end" class="active-range-banner">
      <div class="banner-icon">
        <el-icon><CircleCheckFilled /></el-icon>
      </div>
      <div class="banner-content">
        <span class="banner-label">当前筛选范围</span>
        <span class="banner-value">{{ formatDate(dateRange.start) }} - {{ formatDate(dateRange.end) }}</span>
      </div>
      <div class="banner-badge">{{ getRangeDays }}天</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import dayjs from 'dayjs'
import { useMappingStore } from '../stores/mapping.js'
import { Calendar, DataLine, Check, Timer, CircleCheckFilled } from '@element-plus/icons-vue'

const mappingStore = useMappingStore()

const selectedType = ref('all')
const customStart = ref(null)
const customEnd = ref(null)

const dateRange = computed(() => mappingStore.dateRange)

// 获取数据实际日期范围
const dataDateRange = computed(() => mappingStore.getDataDateRange())

// 计算当前筛选范围的天数
const getRangeDays = computed(() => {
  if (!dateRange.value.start || !dateRange.value.end) return 0
  const start = dayjs(dateRange.value.start, 'YYYYMMDD')
  const end = dayjs(dateRange.value.end, 'YYYYMMDD')
  return end.diff(start, 'day') + 1
})

// 判断是否有数据月份（数据中有当月数据）
const hasDataMonth = computed(() => {
  if (!dataDateRange.value) return false
  const dataMaxMonth = dataDateRange.value.max.slice(0, 6)
  const nowMonth = dayjs().format('YYYYMM')
  return dataMaxMonth === nowMonth
})

// 判断是否有最近30天数据
const hasDataLast30Days = computed(() => {
  if (!dataDateRange.value) return false
  const maxDate = dayjs(dataDateRange.value.max, 'YYYYMMDD')
  const minDate = dayjs(dataDateRange.value.min, 'YYYYMMDD')
  const daysDiff = maxDate.diff(minDate, 'day')
  return daysDiff >= 30
})

// 数据月份标签
const dataMonthLabel = computed(() => {
  if (!dataDateRange.value) return '数据当月'
  const month = dataDateRange.value.max.slice(4, 6)
  return `${parseInt(month)}月数据`
})

// 筛选选项
const filterOptions = computed(() => {
  const options = [
    { value: 'all', label: '全部时间', description: '使用所有数据进行分析' }
  ]
  
  if (hasDataMonth.value) {
    options.push({
      value: 'dataThisMonth',
      label: dataMonthLabel.value,
      description: '仅分析当月数据'
    })
  }
  
  if (hasDataLast30Days.value) {
    options.push({
      value: 'dataLast30Days',
      label: '数据最近30天',
      description: '分析最近30天的数据'
    })
  }
  
  options.push({
    value: 'custom',
    label: '自定义范围',
    description: '手动选择日期区间'
  })
  
  return options
})

function formatDate(dateStr) {
  if (!dateStr) return ''

  // 如果已经是 YYYYMMDD 格式
  if (/^\d{8}$/.test(String(dateStr))) {
    return dayjs(dateStr, 'YYYYMMDD').format('YYYY年MM月DD日')
  }

  // 尝试自动解析其他格式
  const parsed = dayjs(dateStr)
  if (parsed.isValid()) {
    return parsed.format('YYYY年MM月DD日')
  }

  return String(dateStr)
}

function handleTypeChange(type) {
  selectedType.value = type
  
  if (type === 'dataThisMonth') {
    // 基于数据最大日期的当月
    if (dataDateRange.value) {
      const maxDate = dayjs(dataDateRange.value.max, 'YYYYMMDD')
      const start = maxDate.startOf('month').format('YYYYMMDD')
      const end = maxDate.endOf('month').format('YYYYMMDD')
      mappingStore.setDateRange('custom', start, end)
    }
  } else if (type === 'dataLast30Days') {
    // 基于数据最大日期的最近30天
    if (dataDateRange.value) {
      const maxDate = dayjs(dataDateRange.value.max, 'YYYYMMDD')
      const start = maxDate.subtract(29, 'day').format('YYYYMMDD')
      const end = dataDateRange.value.max
      mappingStore.setDateRange('custom', start, end)
    }
  } else if (type !== 'custom') {
    mappingStore.setDateRange(type)
  } else {
    handleCustomChange()
  }
}

function handleCustomChange() {
  if (customStart.value && customEnd.value) {
    // 确保开始日期不大于结束日期
    if (customStart.value > customEnd.value) {
      // 交换
      const temp = customStart.value
      customStart.value = customEnd.value
      customEnd.value = temp
    }
    mappingStore.setDateRange('custom', customStart.value, customEnd.value)
  }
}

// 监听外部变化
watch(() => mappingStore.dateRange, (newRange) => {
  selectedType.value = newRange.type
  if (newRange.type === 'custom') {
    customStart.value = newRange.start
    customEnd.value = newRange.end
  }
}, { immediate: true })
</script>

<style scoped>
.time-filter {
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  border-radius: 16px;
  padding: 20px;
  margin-top: 20px;
  border: 1px solid #e5e7eb;
}

.filter-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.filter-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
}

.filter-title h4 {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 2px 0;
}

.filter-subtitle {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
}

.data-range-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: white;
  border-radius: 12px;
  border: 1px solid rgba(102, 126, 234, 0.2);
  margin-bottom: 16px;
}

.range-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(102, 126, 234, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #667eea;
  font-size: 18px;
}

.range-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.range-label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.range-value {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.filter-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.filter-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: white;
  border-radius: 10px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.25s ease;
}

.filter-option:hover {
  border-color: rgba(102, 126, 234, 0.3);
  transform: translateX(4px);
}

.filter-option.is-active {
  border-color: #667eea;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
}

.option-radio {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #d1d5db;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;
  flex-shrink: 0;
}

.filter-option.is-active .option-radio {
  border-color: #667eea;
  background: #667eea;
}

.radio-inner {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: white;
  transform: scale(0);
  transition: transform 0.25s ease;
}

.filter-option.is-active .radio-inner {
  transform: scale(1);
}

.option-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.option-label {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.option-desc {
  font-size: 12px;
  color: #6b7280;
}

.check-icon {
  color: #667eea;
  font-size: 18px;
}

.custom-range-panel {
  background: white;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  margin-bottom: 16px;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.custom-range-panel .panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #667eea;
  margin-bottom: 14px;
  padding: 0;
}

.date-inputs {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.date-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.date-field label {
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
}

.custom-date-picker {
  width: 100%;
}

.custom-date-picker :deep(.el-input__wrapper) {
  border-radius: 8px;
  box-shadow: 0 0 0 1px #d1d5db inset;
}

.custom-date-picker :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #667eea inset;
}

.custom-date-picker :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.3) inset;
}

.date-separator {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 0;
}

.sep-line {
  flex: 1;
  height: 1px;
  background: #e5e7eb;
}

.date-separator span {
  font-size: 12px;
  color: #9ca3af;
  font-weight: 500;
}

.active-range-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 12px;
  color: white;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(16, 185, 129, 0);
  }
}

.banner-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.banner-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.banner-label {
  font-size: 12px;
  opacity: 0.9;
}

.banner-value {
  font-size: 14px;
  font-weight: 600;
}

.banner-badge {
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

@media (max-width: 768px) {
  .data-range-card {
    flex-direction: column;
    text-align: center;
  }

  .filter-option:hover {
    transform: none;
  }
}
</style>
