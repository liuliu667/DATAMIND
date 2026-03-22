<template>
  <div
    class="upload-zone"
    :class="{
      'is-dragover': isDragOver,
      'is-loading': isLoading,
      'is-success': uploadStatus === 'success',
      'is-error': uploadStatus === 'error',
    }"
    @dragover.prevent="handleDragOver"
    @dragleave.prevent="handleDragLeave"
    @drop.prevent="handleDrop"
    @click="triggerFileInput"
  >
    <input
      ref="fileInput"
      type="file"
      accept=".xlsx,.xls"
      style="display: none"
      @change="handleFileChange"
    />

    <div v-if="isLoading" class="upload-loading">
      <div class="loading-spinner">
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
      </div>
      <p class="loading-text">{{ loadingText }}</p>
      <div v-if="showProgress" class="loading-progress">
        <div class="progress-bar">
          <div class="progress-indeterminate"></div>
        </div>
      </div>
    </div>

    <div v-else-if="uploadStatus === 'success' && fileInfo" class="upload-success">
      <div class="success-icon-wrapper">
        <el-icon class="success-icon"><CircleCheck /></el-icon>
        <div class="success-ring"></div>
      </div>
      <p class="success-title">文件解析成功</p>
      <div class="success-file-card">
        <div class="file-icon">📊</div>
        <div class="file-info">
          <div class="file-name">{{ fileInfo.name }}</div>
          <div class="file-meta">
            <span class="meta-item">{{ formatFileSize(fileInfo.size) }}</span>
            <span class="meta-divider">•</span>
            <span class="meta-item highlight">{{ formatRowCount(fileInfo.rowCount) }} 行数据</span>
          </div>
        </div>
      </div>
      <el-button class="dm-btn dm-btn-primary" @click.stop="resetUpload">
        <el-icon><RefreshRight /></el-icon>
        重新选择
      </el-button>
    </div>

    <div v-else-if="uploadStatus === 'error'" class="upload-error">
      <div class="error-icon-wrapper">
        <el-icon class="error-icon"><CircleClose /></el-icon>
      </div>
      <p class="error-title">解析失败</p>
      <p class="error-message">{{ errorMessage }}</p>
      <el-button class="dm-btn dm-btn-primary" @click.stop="resetUpload">
        <el-icon><RefreshRight /></el-icon>
        重试
      </el-button>
    </div>

    <div v-else class="upload-placeholder">
      <div class="upload-illustration">
        <div class="upload-icon-bg">
          <el-icon class="upload-icon"><UploadFilled /></el-icon>
        </div>
        <div class="floating-elements">
          <span class="float-item" style="--delay: 0s">📄</span>
          <span class="float-item" style="--delay: 0.5s">📊</span>
          <span class="float-item" style="--delay: 1s">📈</span>
        </div>
      </div>
      <p class="upload-title">拖拽 Excel 文件到此处</p>
      <p class="upload-subtitle">或点击选择文件</p>
      <div class="upload-specs">
        <div class="spec-item">
          <el-icon><Document /></el-icon>
          <span>.xlsx 格式</span>
        </div>
        <div class="spec-divider"></div>
        <div class="spec-item">
          <el-icon><Folder /></el-icon>
          <span>最大 100MB</span>
        </div>
        <div class="spec-divider"></div>
        <div class="spec-item">
          <el-icon><DataLine /></el-icon>
          <span>最多 15 万行</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { UploadFilled, CircleCheck, CircleClose, RefreshRight, Document, Folder, DataLine } from '@element-plus/icons-vue'
import { parseExcelFile, validateFile, formatFileSize, formatRowCount, ErrorCodes } from '../utils/fileHandler.js'

const emit = defineEmits(['success', 'error'])

const fileInput = ref(null)
const isDragOver = ref(false)
const isLoading = ref(false)
const uploadStatus = ref('idle')
const fileInfo = ref(null)
const errorMessage = ref('')
const loadingText = ref('正在解析...')
const showProgress = ref(false)

function triggerFileInput() {
  if (isLoading.value || uploadStatus.value === 'success') return
  fileInput.value?.click()
}

function handleDragOver() {
  if (!isLoading.value && uploadStatus.value !== 'success') {
    isDragOver.value = true
  }
}

function handleDragLeave() {
  isDragOver.value = false
}

function handleDrop(e) {
  isDragOver.value = false
  if (isLoading.value || uploadStatus.value === 'success') return

  const files = e.dataTransfer.files
  if (files.length > 0) {
    processFile(files[0])
  }
}

function handleFileChange(e) {
  const files = e.target.files
  if (files.length > 0) {
    processFile(files[0])
  }
}

async function processFile(file) {
  const validation = validateFile(file)
  if (!validation.valid) {
    uploadStatus.value = 'error'
    errorMessage.value = validation.error
    emit('error', { code: 'VALIDATION_ERROR', message: validation.error })
    return
  }

  isLoading.value = true
  uploadStatus.value = 'idle'
  errorMessage.value = ''
  loadingText.value = '正在读取文件...'
  showProgress.value = true

  try {
    loadingText.value = '正在解析 Excel...'

    const result = await parseExcelFile(file)

    fileInfo.value = {
      name: file.name,
      size: file.size,
      rowCount: result.meta.rowCount,
      colCount: result.meta.colCount,
    }

    uploadStatus.value = 'success'
    isLoading.value = false

    emit('success', result)
  } catch (error) {
    console.error('File processing error:', error)

    isLoading.value = false
    uploadStatus.value = 'error'

    if (error.code === ErrorCodes.DATA_TOO_LARGE) {
      errorMessage.value = `文件超出处理上限：${error.details.actualRows?.toLocaleString()} 行 (限制: ${error.details.maxRows?.toLocaleString()} 行)`
    } else if (error.code === ErrorCodes.TIMEOUT) {
      errorMessage.value = '解析超时，文件可能过大或已损坏'
    } else if (error.code === ErrorCodes.EMPTY_FILE) {
      errorMessage.value = '文件为空'
    } else if (error.code === ErrorCodes.PARSE_ERROR) {
      errorMessage.value = `解析失败: ${error.message}`
    } else {
      errorMessage.value = error.message || '未知错误'
    }

    emit('error', { code: error.code, message: errorMessage.value, details: error.details })
  }
}

function resetUpload() {
  uploadStatus.value = 'idle'
  fileInfo.value = null
  errorMessage.value = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

function setLargeFileWarning(rowCount) {
  loadingText.value = `正在处理大量数据 (${rowCount.toLocaleString()} 行)，请耐心等待...`
}

defineExpose({
  resetUpload,
  setLargeFileWarning,
})
</script>

<style scoped>
.upload-zone {
  border: 2px dashed #e2e8f0;
  border-radius: 24px;
  padding: 60px 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  min-height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.upload-zone::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at center, rgba(102, 126, 234, 0.03) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.4s ease;
}

.upload-zone:hover {
  border-color: #667eea;
  background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%);
  box-shadow: 0 20px 40px rgba(102, 126, 234, 0.1);
  transform: translateY(-2px);
}

.upload-zone:hover::before {
  opacity: 1;
}

.upload-zone.is-dragover {
  border-color: #667eea;
  background: linear-gradient(135deg, #f0f4ff 0%, #e8edff 100%);
  box-shadow: 0 20px 40px rgba(102, 126, 234, 0.15);
  transform: scale(1.01);
}

.upload-zone.is-dragover::before {
  opacity: 1;
}

.upload-zone.is-loading {
  cursor: not-allowed;
  border-color: #f59e0b;
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
}

.upload-zone.is-success {
  border-color: #10b981;
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  cursor: default;
}

.upload-zone.is-error {
  border-color: #ef4444;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
}

/* 上传占位区域 */
.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  position: relative;
  z-index: 1;
}

.upload-illustration {
  position: relative;
  width: 100px;
  height: 100px;
  margin-bottom: 8px;
}

.upload-icon-bg {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 12px 32px rgba(102, 126, 234, 0.35);
  animation: float 3s ease-in-out infinite;
}

.upload-icon {
  font-size: 36px;
  color: #fff;
}

.floating-elements {
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.float-item {
  position: absolute;
  font-size: 20px;
  opacity: 0;
  animation: float-up 2s ease-in-out infinite;
  animation-delay: var(--delay);
}

.float-item:nth-child(1) {
  top: 0;
  left: 0;
}

.float-item:nth-child(2) {
  top: 10px;
  right: 0;
}

.float-item:nth-child(3) {
  bottom: 0;
  left: 20px;
}

.upload-title {
  font-size: 22px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  letter-spacing: 0.5px;
}

.upload-subtitle {
  font-size: 15px;
  color: #64748b;
  margin: 0;
  font-weight: 400;
}

.upload-specs {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.spec-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #94a3b8;
  font-weight: 500;
}

.spec-item .el-icon {
  font-size: 14px;
  color: #667eea;
}

.spec-divider {
  width: 4px;
  height: 4px;
  background: #cbd5e1;
  border-radius: 50%;
}

/* 加载状态 */
.upload-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  width: 100%;
  max-width: 320px;
  position: relative;
  z-index: 1;
}

.loading-spinner {
  position: relative;
  width: 60px;
  height: 60px;
}

.spinner-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  border: 3px solid transparent;
  border-top-color: #667eea;
  animation: spin 1s linear infinite;
}

.spinner-ring:nth-child(1) {
  width: 60px;
  height: 60px;
  animation-duration: 1s;
}

.spinner-ring:nth-child(2) {
  width: 45px;
  height: 45px;
  border-top-color: #764ba2;
  animation-duration: 0.8s;
  animation-direction: reverse;
}

.spinner-ring:nth-child(3) {
  width: 30px;
  height: 30px;
  border-top-color: #a855f7;
  animation-duration: 0.6s;
}

.loading-text {
  font-size: 16px;
  color: #475569;
  margin: 0;
  font-weight: 500;
}

.loading-progress {
  width: 100%;
}

.progress-bar {
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
}

.progress-indeterminate {
  height: 100%;
  width: 40%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 2px;
  animation: indeterminate 1.5s ease-in-out infinite;
}

/* 成功状态 */
.upload-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  position: relative;
  z-index: 1;
}

.success-icon-wrapper {
  position: relative;
  width: 72px;
  height: 72px;
}

.success-icon {
  font-size: 40px;
  color: #10b981;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
}

.success-ring {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 3px solid #10b981;
  border-radius: 50%;
  animation: ring-pulse 2s ease-out infinite;
}

.success-title {
  font-size: 20px;
  font-weight: 600;
  color: #059669;
  margin: 0;
}

.success-file-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(255, 255, 255, 0.8);
  padding: 20px 24px;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  margin: 8px 0;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(16, 185, 129, 0.1);
}

.file-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.file-info {
  text-align: left;
}

.file-name {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
  max-width: 280px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #64748b;
}

.meta-divider {
  color: #cbd5e1;
}

.meta-item.highlight {
  color: #059669;
  font-weight: 600;
}

/* 错误状态 */
.upload-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  position: relative;
  z-index: 1;
}

.error-icon-wrapper {
  width: 72px;
  height: 72px;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(239, 68, 68, 0.3);
  animation: shake 0.5s ease-in-out;
}

.error-icon {
  font-size: 36px;
  color: #fff;
}

.error-title {
  font-size: 20px;
  font-weight: 600;
  color: #dc2626;
  margin: 0;
}

.error-message {
  font-size: 14px;
  color: #64748b;
  margin: 0 0 8px 0;
  max-width: 400px;
  word-break: break-word;
  background: rgba(255, 255, 255, 0.6);
  padding: 12px 16px;
  border-radius: 10px;
  backdrop-filter: blur(10px);
}

/* 按钮样式 */
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

.dm-btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.35);
}

.dm-btn-primary:hover {
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.45);
  transform: translateY(-2px);
}

/* 动画 */
@keyframes float {
  0%, 100% {
    transform: translate(-50%, -50%) translateY(0);
  }
  50% {
    transform: translate(-50%, -50%) translateY(-8px);
  }
}

@keyframes float-up {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateY(-20px);
  }
}

@keyframes spin {
  from {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

@keyframes indeterminate {
  0% {
    transform: translateX(-100%);
  }
  50% {
    transform: translateX(200%);
  }
  100% {
    transform: translateX(-100%);
  }
}

@keyframes ring-pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-8px);
  }
  75% {
    transform: translateX(8px);
  }
}

/* 响应式适配 */
@media (max-width: 768px) {
  .upload-zone {
    padding: 40px 24px;
    min-height: 280px;
    border-radius: 20px;
  }
  
  .upload-title {
    font-size: 18px;
  }
  
  .upload-subtitle {
    font-size: 14px;
  }
  
  .upload-specs {
    flex-direction: column;
    gap: 8px;
  }
  
  .spec-divider {
    display: none;
  }
  
  .success-file-card {
    flex-direction: column;
    text-align: center;
    padding: 16px 20px;
  }
  
  .file-info {
    text-align: center;
  }
  
  .file-name {
    max-width: 200px;
  }
}
</style>
