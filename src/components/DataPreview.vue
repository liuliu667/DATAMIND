<template>
  <div class="data-preview">
    <div class="preview-header">
      <div class="preview-title-section">
        <div class="title-badge">
          <el-icon><View /></el-icon>
        </div>
        <div class="title-content">
          <h3 class="preview-title">数据预览</h3>
          <p class="preview-subtitle">
            共 <span class="highlight">{{ formatRowCount(meta.rowCount) }}</span> 行，
            <span class="highlight">{{ meta.colCount }}</span> 列数据
            <span v-if="meta.dateColumns.length > 0" class="date-badge">
              <el-icon><Calendar /></el-icon>
              检测到 {{ meta.dateColumns.length }} 个日期列
            </span>
          </p>
        </div>
      </div>
      <div class="preview-actions">
        <el-button class="dm-btn dm-btn-secondary" @click="handleReset">
          <el-icon><RefreshLeft /></el-icon>
          重新选择
        </el-button>
        <el-button class="dm-btn dm-btn-primary" @click="handleContinue">
          数据正确，继续
          <el-icon class="el-icon--right"><ArrowRight /></el-icon>
        </el-button>
      </div>
    </div>

    <div v-if="meta.dirtyColumns && meta.dirtyColumns.length > 0" class="dirty-warning">
      <el-alert
        :title="`以下列包含无法识别的日期格式：${meta.dirtyColumns.join('、')}`"
        type="warning"
        :closable="false"
        show-icon
      />
    </div>

    <div class="preview-table-wrapper">
      <el-table
        :data="previewData"
        stripe
        border
        size="small"
        max-height="400"
        class="preview-table"
      >
        <el-table-column
          v-for="header in meta.headers"
          :key="header"
          :prop="header"
          :label="header"
          min-width="120"
          show-overflow-tooltip
        >
          <template #header>
            <div class="column-header">
              <span class="column-name">{{ header }}</span>
              <el-tag
                v-if="isDateColumn(header)"
                size="small"
                type="success"
                class="date-tag"
                effect="dark"
              >
                <el-icon><Calendar /></el-icon>
                日期
              </el-tag>
            </div>
          </template>
          <template #default="{ row, $index }">
            <span
              :class="{
                'dirty-cell': isDirtyCell(header, row[header]),
              }"
            >
              {{ row[header] }}
            </span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="preview-footer">
      <div class="preview-note">
        <el-icon><InfoFilled /></el-icon>
        <span>显示前 10 行数据预览。日期格式已自动标准化为 YYYYMMDD。</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { RefreshLeft, ArrowRight, InfoFilled, View, Calendar } from '@element-plus/icons-vue'

const props = defineProps({
  meta: {
    type: Object,
    required: true,
    default: () => ({
      fileName: '',
      rowCount: 0,
      colCount: 0,
      headers: [],
      dateColumns: [],
      dirtyColumns: [],
    }),
  },
  previewData: {
    type: Array,
    required: true,
    default: () => [],
  },
})

const emit = defineEmits(['reset', 'continue'])

function formatRowCount(count) {
  return count.toLocaleString()
}

function isDateColumn(header) {
  return props.meta.dateColumns.includes(header)
}

function isDirtyCell(header, value) {
  if (!props.meta.dirtyColumns.includes(header)) return false
  if (!value || value === '') return false

  return true
}

function handleReset() {
  emit('reset')
}

function handleContinue() {
  emit('continue', {
    meta: props.meta,
    previewData: props.previewData,
  })
}
</script>

<style scoped>
.data-preview {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 32px;
  box-shadow: 
    0 4px 6px -1px rgba(0, 0, 0, 0.05),
    0 2px 4px -1px rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 20px;
}

.preview-title-section {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.title-badge {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 22px;
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
  flex-shrink: 0;
}

.title-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.preview-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: 0.3px;
}

.preview-subtitle {
  margin: 0;
  font-size: 14px;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.preview-subtitle .highlight {
  color: #5b6af5;
  font-weight: 600;
}

.date-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #fff;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  margin-left: 4px;
}

.date-badge .el-icon {
  font-size: 12px;
}

.preview-actions {
  display: flex;
  gap: 12px;
}

.dm-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
  cursor: pointer;
}

.dm-btn-secondary {
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  color: #475569;
  border: 1px solid #cbd5e1;
}

.dm-btn-secondary:hover {
  background: linear-gradient(135deg, #e2e8f0 0%, #d1d5db 100%);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.dm-btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.35);
}

.dm-btn-primary:hover {
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.45);
  transform: translateY(-2px);
}

.dirty-warning {
  margin-bottom: 20px;
}

.preview-table-wrapper {
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.preview-table {
  width: 100%;
}

.preview-table :deep(.el-table__header) {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.preview-table :deep(.el-table__header th) {
  background: transparent;
  font-weight: 600;
  color: #475569;
  padding: 14px 12px;
}

.preview-table :deep(.el-table__row) {
  transition: all 0.2s ease;
}

.preview-table :deep(.el-table__row:hover) {
  background: #f8fafc;
}

.column-header {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
}

.column-name {
  font-weight: 600;
  color: #334155;
}

.date-tag {
  flex-shrink: 0;
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 600;
}

.date-tag :deep(.el-icon) {
  margin-right: 2px;
  font-size: 10px;
}

.dirty-cell {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.08);
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid rgba(239, 68, 68, 0.15);
  font-weight: 500;
}

.preview-footer {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
}

.preview-note {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  font-size: 13px;
  color: #64748b;
  background: #f8fafc;
  padding: 12px 16px;
  border-radius: 10px;
}

.preview-note .el-icon {
  color: #667eea;
  font-size: 16px;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .data-preview {
    padding: 20px;
    border-radius: 20px;
  }
  
  .preview-header {
    flex-direction: column;
    gap: 16px;
  }
  
  .preview-actions {
    width: 100%;
    justify-content: stretch;
  }
  
  .preview-actions .dm-btn {
    flex: 1;
    justify-content: center;
  }
  
  .title-badge {
    width: 40px;
    height: 40px;
    font-size: 18px;
    border-radius: 12px;
  }
  
  .preview-title {
    font-size: 18px;
  }
  
  .preview-table-wrapper {
    border-radius: 12px;
  }
}
</style>
