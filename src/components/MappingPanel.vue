<template>
  <div class="mapping-panel">
    <div class="panel-header">
      <div class="header-badge">
        <el-icon><Link /></el-icon>
      </div>
      <div class="header-content">
        <h2 class="header-title">字段映射配置</h2>
        <p class="header-subtitle">将 Excel 列与模板字段进行匹配，系统已智能推荐最佳匹配</p>
      </div>
    </div>

    <div class="template-card">
      <div class="template-icon-wrapper" :class="`icon-${currentTemplate?.id}`">
        <el-icon :size="28">
          <component :is="getIcon(currentTemplate?.icon)" />
        </el-icon>
      </div>
      <div class="template-info">
        <h3 class="template-name">{{ currentTemplate?.name }}</h3>
        <p class="template-description">{{ currentTemplate?.description }}</p>
      </div>
      <div class="template-status" :class="{ 'is-complete': isMappingComplete }">
        <el-icon v-if="isMappingComplete"><CircleCheckFilled /></el-icon>
        <el-icon v-else><InfoFilled /></el-icon>
        <span>{{ isMappingComplete ? '配置完成' : '配置中' }}</span>
      </div>
    </div>

    <div class="mapping-content">
      <div class="mapping-section required-section">
        <div class="section-header">
          <div class="section-icon">
            <el-icon><Key /></el-icon>
          </div>
          <div class="section-title">
            <span>必需字段</span>
            <span class="required-badge">必填</span>
          </div>
          <div class="section-progress">
            <span class="progress-text">{{ requiredFieldsFilled }}/{{ currentTemplate?.requiredFields?.length }}</span>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: requiredProgress + '%' }"></div>
            </div>
          </div>
        </div>

        <div class="mapping-list">
          <div
            v-for="(field, index) in currentTemplate?.requiredFields"
            :key="field.key"
            class="mapping-row"
            :class="{ 
              'is-mapped': mappings[field.key] !== undefined && mappings[field.key] !== null,
              'has-error': validationErrors[field.key]
            }"
            :style="{ animationDelay: `${index * 0.05}s` }"
          >
            <div class="field-indicator">
              <div class="indicator-dot" :class="{ 'is-active': mappings[field.key] !== undefined && mappings[field.key] !== null }"></div>
              <div v-if="index < currentTemplate?.requiredFields?.length - 1" class="indicator-line"></div>
            </div>

            <div class="field-card">
              <div class="field-header">
                <div class="field-label">
                  <span class="label-text">{{ field.label }}</span>
                  <span class="label-type">{{ getTypeText(field.type) }}</span>
                  <span class="required-mark">*</span>
                </div>
                <el-tag v-if="validationErrors[field.key]" type="danger" size="small" effect="light">
                  <el-icon><Warning /></el-icon>
                  需修正
                </el-tag>
              </div>

              <div class="field-body">
                <el-select
                  v-model="mappings[field.key]"
                  placeholder="选择 Excel 列"
                  clearable
                  class="mapping-select"
                  :class="{ 'is-mapped': mappings[field.key] !== undefined && mappings[field.key] !== null }"
                  @change="(val) => handleMappingChange(field.key, val)"
                >
                  <el-option
                    v-for="option in getSortedOptions(field.key)"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                    class="mapping-option"
                  >
                    <div class="option-content">
                      <span class="option-label">{{ option.label }}</span>
                      <el-tag
                        v-if="option.score > 20"
                        size="small"
                        type="success"
                        effect="dark"
                        class="match-tag"
                      >
                        <el-icon><StarFilled /></el-icon>
                        智能推荐
                      </el-tag>
                    </div>
                  </el-option>
                </el-select>

                <div v-if="mappings[field.key] !== undefined && mappings[field.key] !== null" class="field-preview">
                  <div class="preview-header">
                    <el-icon><View /></el-icon>
                    <span>数据预览</span>
                  </div>
                  <div class="preview-values">
                    <span v-for="(value, idx) in getPreviewValuesArray(mappings[field.key])" :key="idx" class="preview-item">
                      {{ value }}
                    </span>
                  </div>
                </div>

                <el-alert
                  v-if="validationErrors[field.key]"
                  :title="validationErrors[field.key].message"
                  type="error"
                  :closable="false"
                  show-icon
                  class="validation-alert"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="mapping-section optional-section">
        <div class="section-header">
          <div class="section-icon optional">
            <el-icon><CirclePlus /></el-icon>
          </div>
          <div class="section-title">
            <span>可选字段</span>
            <span class="optional-badge">选填</span>
          </div>
        </div>

        <div class="mapping-list">
          <div
            v-for="(field, index) in currentTemplate?.optionalFields"
            :key="field.key"
            class="mapping-row optional"
            :class="{ 'is-mapped': mappings[field.key] !== undefined && mappings[field.key] !== null }"
            :style="{ animationDelay: `${(index + (currentTemplate?.requiredFields?.length || 0)) * 0.05}s` }"
          >
            <div class="field-indicator">
              <div class="indicator-dot optional" :class="{ 'is-active': mappings[field.key] !== undefined && mappings[field.key] !== null }"></div>
            </div>

            <div class="field-card">
              <div class="field-header">
                <div class="field-label">
                  <span class="label-text">{{ field.label }}</span>
                  <span class="label-type optional">{{ getTypeText(field.type) }}</span>
                </div>
              </div>

              <div class="field-body">
                <el-select
                  v-model="mappings[field.key]"
                  placeholder="选择 Excel 列（可选）"
                  clearable
                  class="mapping-select"
                  :class="{ 'is-mapped': mappings[field.key] !== undefined && mappings[field.key] !== null }"
                  @change="(val) => handleMappingChange(field.key, val)"
                >
                  <el-option
                    v-for="option in getSortedOptions(field.key)"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>

                <div v-if="mappings[field.key] !== undefined && mappings[field.key] !== null" class="field-preview">
                  <div class="preview-header">
                    <el-icon><View /></el-icon>
                    <span>数据预览</span>
                  </div>
                  <div class="preview-values">
                    <span v-for="(value, idx) in getPreviewValuesArray(mappings[field.key])" :key="idx" class="preview-item">
                      {{ value }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <TimeFilter v-if="hasDateMapping" />
      </div>
    </div>

    <div class="panel-actions">
      <button class="dm-btn dm-btn-secondary" @click="handleBack">
        <el-icon><ArrowLeft /></el-icon>
        <span>上一步</span>
      </button>
      <button
        class="dm-btn dm-btn-primary"
        :class="{ 'is-disabled': !isMappingComplete }"
        :disabled="!isMappingComplete"
        @click="handleGenerate"
      >
        <span>生成分析报告</span>
        <el-icon class="btn-icon"><ArrowRight /></el-icon>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { 
  ArrowLeft, 
  ArrowRight, 
  Trophy, 
  Goods, 
  UserFilled, 
  MapLocation,
  Link,
  Key,
  CirclePlus,
  StarFilled,
  View,
  CircleCheckFilled,
  InfoFilled,
  Warning
} from '@element-plus/icons-vue'
import { useMappingStore } from '../stores/mapping.js'
import { sortHeadersByRelevance } from '../utils/fieldMatcher.js'
import TimeFilter from './TimeFilter.vue'

const emit = defineEmits(['back', 'generate'])

const mappingStore = useMappingStore()

const currentTemplate = computed(() => mappingStore.currentTemplate)
const mappings = computed(() => mappingStore.mappings)
const validationErrors = computed(() => mappingStore.validationErrors)
const isMappingComplete = computed(() => mappingStore.isMappingComplete)
const hasDateMapping = computed(() => mappingStore.hasDateMapping)
const excelHeaders = computed(() => mappingStore.excelHeaders)
const excelData = computed(() => mappingStore.excelData)

const requiredFieldsFilled = computed(() => {
  if (!currentTemplate.value?.requiredFields) return 0
  return currentTemplate.value.requiredFields.filter(field => 
    mappings.value[field.key] !== undefined && mappings.value[field.key] !== null
  ).length
})

const requiredProgress = computed(() => {
  if (!currentTemplate.value?.requiredFields?.length) return 0
  return (requiredFieldsFilled.value / currentTemplate.value.requiredFields.length) * 100
})

const iconMap = {
  Trophy,
  Goods,
  UserFilled,
  MapLocation
}

function getIcon(iconName) {
  return iconMap[iconName] || Trophy
}

function getTypeText(type) {
  const typeMap = {
    string: '文本',
    number: '数字',
    date: '日期'
  }
  return typeMap[type] || type
}

function getSortedOptions(fieldKey) {
  return sortHeadersByRelevance(excelHeaders.value, fieldKey)
}

function getPreviewValuesArray(columnIndex) {
  if (!excelData.value || excelData.value.length === 0) return []

  return excelData.value
    .slice(0, 3)
    .map(row => row[columnIndex])
    .filter(v => v !== undefined && v !== null && v !== '')
    .map(v => String(v).length > 20 ? String(v).slice(0, 20) + '...' : v)
}

function handleMappingChange(fieldKey, value) {
  mappingStore.setMapping(fieldKey, value)
}

function handleBack() {
  emit('back')
}

async function handleGenerate() {
  const result = mappingStore.generateMappingConfig()
  if (result.valid) {
    try {
      await mappingStore.calculateResultsWithComparison()
      emit('generate', result)
    } catch (error) {
      console.error('Calculation failed:', error)
    }
  }
}
</script>

<style scoped>
.mapping-panel {
  padding: 24px 0;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding: 0 4px;
}

.header-badge {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  box-shadow: 0 4px 14px rgba(102, 126, 234, 0.4);
}

.header-content {
  flex: 1;
}

.header-title {
  font-size: 22px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 4px 0;
  letter-spacing: -0.5px;
}

.header-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.template-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  border: 1px solid rgba(102, 126, 234, 0.15);
  border-radius: 16px;
  margin-bottom: 24px;
  position: relative;
  overflow: hidden;
}

.template-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
}

.template-icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 28px;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.icon-top10 {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.icon-product {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.icon-comparison {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.icon-region {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
}

.template-info {
  flex: 1;
  min-width: 0;
}

.template-name {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 4px 0;
}

.template-description {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.template-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  background: #f3f4f6;
  color: #6b7280;
  transition: all 0.3s ease;
}

.template-status.is-complete {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.mapping-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-bottom: 32px;
}

.mapping-section {
  background: white;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.required-section {
  border-color: rgba(102, 126, 234, 0.2);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  border-bottom: 1px solid #e5e7eb;
}

.section-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
}

.section-icon.optional {
  background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
}

.section-title {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.required-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
}

.optional-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  background: #e5e7eb;
  color: #6b7280;
}

.section-progress {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-text {
  font-size: 13px;
  font-weight: 600;
  color: #667eea;
}

.progress-bar {
  width: 80px;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 3px;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.mapping-list {
  padding: 20px;
}

.mapping-row {
  display: flex;
  gap: 16px;
  opacity: 0;
  animation: slideInUp 0.4s ease forwards;
}

.mapping-row:not(:last-child) {
  margin-bottom: 16px;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.field-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 20px;
}

.indicator-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #e5e7eb;
  border: 2px solid #d1d5db;
  transition: all 0.3s ease;
}

.indicator-dot.is-active {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-color: #10b981;
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.2);
}

.indicator-dot.optional.is-active {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
}

.indicator-line {
  flex: 1;
  width: 2px;
  min-height: 40px;
  background: linear-gradient(180deg, #e5e7eb 0%, #d1d5db 100%);
  margin: 8px 0;
}

.field-card {
  flex: 1;
  padding: 16px 20px;
  background: #f9fafb;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
}

.mapping-row.is-mapped .field-card {
  background: white;
  border-color: rgba(102, 126, 234, 0.3);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.08);
}

.mapping-row.has-error .field-card {
  border-color: #ef4444;
  background: linear-gradient(135deg, #fef2f2 0%, #fff 100%);
}

.field-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.field-label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.label-text {
  font-weight: 600;
  color: #1f2937;
  font-size: 15px;
}

.label-type {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.label-type.optional {
  background: #f3f4f6;
  color: #9ca3af;
}

.required-mark {
  color: #ef4444;
  font-weight: bold;
  font-size: 16px;
}

.mapping-select {
  width: 100%;
}

.mapping-select :deep(.el-input__wrapper) {
  border-radius: 8px;
  box-shadow: 0 0 0 1px #d1d5db inset;
  transition: all 0.3s ease;
}

.mapping-select :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #667eea inset;
}

.mapping-select :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.3) inset;
}

.mapping-select.is-mapped :deep(.el-input__wrapper) {
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.3) inset;
}

.option-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.match-tag {
  display: flex;
  align-items: center;
  gap: 4px;
}

.field-preview {
  margin-top: 12px;
  padding: 12px;
  background: linear-gradient(135deg, #f0fdf4 0%, #fff 100%);
  border-radius: 8px;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #059669;
  font-weight: 500;
  margin-bottom: 8px;
}

.preview-values {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.preview-item {
  padding: 4px 10px;
  background: white;
  border-radius: 6px;
  font-size: 13px;
  color: #374151;
  border: 1px solid #d1d5db;
  font-style: italic;
}

.validation-alert {
  margin-top: 12px;
  border-radius: 8px;
}

.panel-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

.dm-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 28px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
  outline: none;
}

.dm-btn-secondary {
  background: #f3f4f6;
  color: #4b5563;
  border: 1px solid #e5e7eb;
}

.dm-btn-secondary:hover {
  background: #e5e7eb;
  color: #1f2937;
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

.dm-btn-primary.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

.btn-icon {
  transition: transform 0.3s ease;
}

.dm-btn-primary:hover:not(:disabled) .btn-icon {
  transform: translateX(3px);
}

@media (max-width: 768px) {
  .template-card {
    flex-direction: column;
    text-align: center;
  }

  .template-status {
    align-self: center;
  }

  .section-progress {
    display: none;
  }

  .field-indicator {
    display: none;
  }

  .panel-actions {
    flex-direction: column-reverse;
  }

  .dm-btn {
    width: 100%;
  }
}
</style>
