<template>
  <el-container class="app-container">
    <el-header class="app-header">
      <div class="header-content">
        <div class="brand-section">
          <div class="brand-logo">
            <div class="logo-icon">🧀</div>
            <div class="logo-text">
              <span class="company-name">奶酪数智</span>
              <span class="product-name">DATAMIND</span>
            </div>
          </div>
          <div class="brand-divider"></div>
          <div class="brand-tagline">企业智能决策系统</div>
        </div>
      </div>
    </el-header>

    <el-main class="app-main">
      <!-- 步骤导航器 -->
      <StepNavigator
        :steps="workflowSteps"
        :current-step="currentStep"
        :allow-back="true"
        @step-click="handleStepClick"
      />

      <!-- 步骤内容区域 -->
      <div class="step-content-wrapper">
        <!-- 步骤 0: 上传数据 -->
        <Transition name="step-fade" mode="out-in">
          <div v-if="currentStep === 0" key="upload" class="step-panel">
            <UploadZone
              ref="uploadZoneRef"
              @success="handleUploadSuccess"
              @error="handleUploadError"
            />
          </div>
        </Transition>

        <!-- 步骤 1: 预览确认 -->
        <Transition name="step-fade" mode="out-in">
          <div v-if="currentStep === 1" key="preview" class="step-panel">
            <DataPreview
              :meta="parsedData.meta"
              :preview-data="parsedData.preview"
              @reset="handleReset"
              @continue="handleContinueToTemplate"
            />
          </div>
        </Transition>

        <!-- 步骤 2: 选择模板 -->
        <Transition name="step-fade" mode="out-in">
          <div v-if="currentStep === 2" key="template" class="step-panel">
            <TemplateSelect
              @back="handleBackToPreview"
              @next="handleContinueToMapping"
            />
          </div>
        </Transition>

        <!-- 步骤 3: 字段映射 -->
        <Transition name="step-fade" mode="out-in">
          <div v-if="currentStep === 3" key="mapping" class="step-panel">
            <MappingPanel
              @back="handleBackToTemplate"
              @generate="handleGenerateReport"
            />
          </div>
        </Transition>

        <!-- 步骤 4: 数据分析 -->
        <Transition name="step-fade" mode="out-in">
          <div v-if="currentStep === 4" key="dashboard" class="step-panel">
            <div class="dashboard-container">
              <div class="dashboard-header">
                <el-button 
                  class="dm-btn dm-btn-secondary"
                  @click="handleBackToMapping"
                >
                  <el-icon><ArrowLeft /></el-icon>
                  返回配置
                </el-button>
                <el-button 
                  class="dm-btn dm-btn-danger"
                  @click="handleReset"
                >
                  <el-icon><RefreshRight /></el-icon>
                  重新开始
                </el-button>
              </div>
              
              <Top10View v-if="mappingStore.currentTemplate?.id === 'top10'" />
              <ProductView v-else-if="mappingStore.currentTemplate?.id === 'product'" />
              <ComparisonView v-else-if="mappingStore.currentTemplate?.id === 'comparison'" />
              <RegionView v-else-if="mappingStore.currentTemplate?.id === 'region'" />
              <el-card v-else class="dashboard-card">
                <template #header>
                  <div class="card-header">
                    <span>数据分析仪表板</span>
                  </div>
                </template>
                <el-empty description="该模板开发中..." />
              </el-card>
            </div>
          </div>
        </Transition>
      </div>

      <!-- 环境信息 -->
      <div class="env-info-bar">
        <div class="env-item">
          <span class="env-label">运行环境</span>
          <el-tag type="info" size="small" effect="plain">Node {{ nodeVersion }}</el-tag>
        </div>
        <div class="env-divider"></div>
        <div class="env-item">
          <span class="env-label">桌面框架</span>
          <el-tag type="info" size="small" effect="plain">Electron {{ electronVersion }}</el-tag>
        </div>
        <div class="env-divider"></div>
        <div class="env-item">
          <span class="env-label">系统平台</span>
          <el-tag type="info" size="small" effect="plain">{{ platform }}</el-tag>
        </div>
      </div>
    </el-main>

    <el-footer class="app-footer">
      <div class="footer-content">
        <div class="footer-brand">
          <span class="footer-logo">🧀</span>
          <span class="footer-name">奶酪数智</span>
        </div>
        <div class="footer-divider">|</div>
        <div class="footer-product">DATAMIND V1.2</div>
        <div class="footer-divider">|</div>
        <div class="footer-copyright">© 2024 保留所有权利</div>
      </div>
    </el-footer>
  </el-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { InfoFilled, ArrowLeft, RefreshRight, Upload, View, Grid, SetUp, DataAnalysis } from '@element-plus/icons-vue'
import StepNavigator from './components/StepNavigator.vue'
import UploadZone from './components/UploadZone.vue'
import DataPreview from './components/DataPreview.vue'
import TemplateSelect from './components/TemplateSelect.vue'
import MappingPanel from './components/MappingPanel.vue'
import Top10View from './templates/top10/view.vue'
import ProductView from './templates/product/view.vue'
import ComparisonView from './templates/comparison/view.vue'
import RegionView from './templates/region/view.vue'
import { useMappingStore } from './stores/mapping.js'

const mappingStore = useMappingStore()

// 工作流步骤定义
const workflowSteps = [
  { 
    id: 'upload', 
    title: '上传数据', 
    description: '选择 Excel 文件',
    icon: Upload
  },
  { 
    id: 'preview', 
    title: '预览确认', 
    description: '检查数据格式',
    icon: View
  },
  { 
    id: 'template', 
    title: '选择模板', 
    description: '选择分析类型',
    icon: Grid
  },
  { 
    id: 'mapping', 
    title: '字段映射', 
    description: '配置数据列',
    icon: SetUp
  },
  { 
    id: 'dashboard', 
    title: '数据分析', 
    description: '查看统计结果',
    icon: DataAnalysis
  }
]

const currentStep = ref(0)
const nodeVersion = ref('')
const electronVersion = ref('')
const platform = ref('')
const parsedData = ref({
  meta: null,
  preview: [],
  rawData: [],
  headers: [],
})
const uploadZoneRef = ref(null)

onMounted(() => {
  if (window.electronAPI) {
    nodeVersion.value = window.electronAPI.nodeVersion || 'N/A'
    electronVersion.value = window.electronAPI.electronVersion || 'N/A'
    platform.value = window.electronAPI.platform || 'N/A'
  }
})

// 步骤点击处理（回退功能）
async function handleStepClick(targetStep) {
  if (targetStep >= currentStep.value) return
  
  // 如果从分析页面回退，提示确认
  if (currentStep.value === 4 && targetStep < 4) {
    try {
      await ElMessageBox.confirm(
        '返回上一步将保留当前配置，是否继续？',
        '确认返回',
        {
          confirmButtonText: '继续',
          cancelButtonText: '取消',
          type: 'info'
        }
      )
      currentStep.value = targetStep
    } catch {
      // 用户取消
    }
  } else {
    currentStep.value = targetStep
  }
}

function handleUploadSuccess(result) {
  parsedData.value = result
  currentStep.value = 1
  ElMessage.success(`成功解析 ${result.meta.rowCount.toLocaleString()} 行数据`)
}

function handleUploadError(error) {
  ElMessage.error(error.message || '文件上传失败')
}

function handleReset() {
  ElMessageBox.confirm(
    '确定要重新开始吗？当前所有数据将丢失。',
    '确认重置',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    currentStep.value = 0
    parsedData.value = {
      meta: null,
      preview: [],
      rawData: [],
      headers: [],
    }
    mappingStore.reset()
    if (uploadZoneRef.value) {
      uploadZoneRef.value.resetUpload()
    }
    ElMessage.success('已重置，请上传新文件')
  }).catch(() => {})
}

function handleContinueToTemplate() {
  mappingStore.setExcelData(parsedData.value.headers, parsedData.value.rawData)
  currentStep.value = 2
  ElMessage.info('请选择分析模板')
}

function handleBackToPreview() {
  currentStep.value = 1
}

function handleContinueToMapping() {
  currentStep.value = 3
  ElMessage.info('请配置字段映射')
}

function handleBackToTemplate() {
  currentStep.value = 2
}

function handleBackToMapping() {
  currentStep.value = 3
}

function handleGenerateReport(result) {
  currentStep.value = 4
  ElMessage.success('报告生成完成')
}
</script>

<style scoped>
/* ==================== 设计系统变量 ==================== */
:root {
  --dm-primary: #5b6af5;
  --dm-primary-light: #e8eaf6;
  --dm-primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --dm-success: #00c853;
  --dm-warning: #ffab00;
  --dm-danger: #ff5252;
  --dm-bg: #fafbfc;
  --dm-bg-elevated: #ffffff;
  --dm-text-primary: #1a1a2e;
  --dm-text-secondary: #6b7280;
  --dm-shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --dm-shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --dm-shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --dm-radius-sm: 8px;
  --dm-radius-md: 12px;
  --dm-radius-lg: 16px;
}

/* ==================== 应用容器 ==================== */
.app-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8f9fc 0%, #f0f2f8 100%);
}

/* ==================== 头部区域 ==================== */
.app-header {
  background: linear-gradient(135deg, #1a1a2e 0%, #2d2d44 100%);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  height: 72px;
  position: relative;
  overflow: hidden;
  animation: headerSlideDown 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes headerSlideDown {
  0% {
    opacity: 0;
    transform: translateY(-100%);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.app-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(ellipse at top right, rgba(91, 106, 245, 0.15) 0%, transparent 50%);
  pointer-events: none;
}

.app-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, rgba(91, 106, 245, 0.3) 50%, transparent 100%);
}

.header-content {
  position: relative;
  z-index: 1;
}

/* 品牌区域 */
.brand-section {
  display: flex;
  align-items: center;
  gap: 20px;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: logoPulse 2s ease-in-out infinite;
}

@keyframes logoPulse {
  0%, 100% {
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }
  50% {
    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.6);
  }
}

.brand-logo:hover .logo-icon {
  transform: scale(1.05) rotate(5deg);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

.logo-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.company-name {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
  letter-spacing: 2px;
}

.product-name {
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 3px;
  text-transform: uppercase;
  background: linear-gradient(135deg, #fff 0%, #a8b2ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.brand-divider {
  width: 1px;
  height: 32px;
  background: rgba(255, 255, 255, 0.2);
}

.brand-tagline {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 400;
  letter-spacing: 1px;
}

/* ==================== 主内容区域 ==================== */
.app-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px;
}

.step-content-wrapper {
  min-height: 500px;
  position: relative;
}

.step-panel {
  width: 100%;
}

/* 步骤切换动画 */
.step-fade-enter-active,
.step-fade-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.step-fade-enter-from {
  opacity: 0;
  transform: translateX(40px) scale(0.98);
}

.step-fade-leave-to {
  opacity: 0;
  transform: translateX(-40px) scale(0.98);
}

/* 步骤面板进入动画 */
.step-panel {
  animation: panelEnter 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes panelEnter {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ==================== 仪表板容器 ==================== */
.dashboard-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 4px;
}

/* 自定义按钮样式 */
.dm-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: 10px;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;
}

.dm-btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  box-shadow: 0 4px 14px rgba(102, 126, 234, 0.4);
}

.dm-btn-primary:hover {
  background: linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
  transform: translateY(-2px);
}

.dm-btn-primary.is-disabled,
.dm-btn-primary:disabled {
  background: linear-gradient(135deg, #c0c4cc 0%, #a8abb2 100%);
  box-shadow: none;
  cursor: not-allowed;
  transform: none;
}

.dm-btn-secondary {
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
  color: #606266;
  border: 1px solid #dcdfe6;
}

.dm-btn-secondary:hover {
  background: linear-gradient(135deg, #e8eaf6 0%, #d4d9e8 100%);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.dm-btn-danger {
  background: linear-gradient(135deg, #fef0f0 0%, #fde2e2 100%);
  color: #f56c6c;
  border: 1px solid #fbc4c4;
}

.dm-btn-danger:hover {
  background: linear-gradient(135deg, #fde2e2 0%, #fcd3d3 100%);
  box-shadow: 0 4px 12px rgba(245, 108, 108, 0.2);
  transform: translateY(-1px);
}

.dashboard-card {
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: none;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-weight: 600;
  font-size: 16px;
}

/* ==================== 环境信息栏 ==================== */
.env-info-bar {
  margin-top: 32px;
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  flex-wrap: wrap;
  animation: fadeInUp 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.3s both;
}

@keyframes fadeInUp {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.env-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.env-label {
  font-size: 12px;
  color: #9ca3af;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.env-divider {
  width: 1px;
  height: 16px;
  background: #e5e7eb;
}

/* ==================== 页脚区域 ==================== */
.app-footer {
  background: #1a1a2e;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding: 20px;
  animation: footerSlideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.2s both;
}

@keyframes footerSlideUp {
  0% {
    opacity: 0;
    transform: translateY(100%);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.footer-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 8px;
}

.footer-logo {
  font-size: 16px;
}

.footer-name {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

.footer-divider {
  color: rgba(255, 255, 255, 0.3);
  font-size: 12px;
}

.footer-product {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 600;
  letter-spacing: 1px;
}

.footer-copyright {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

/* ==================== 响应式适配 ==================== */
@media (max-width: 768px) {
  .app-main {
    padding: 16px;
  }
  
  .app-header {
    height: 64px;
  }
  
  .brand-section {
    gap: 12px;
  }
  
  .brand-divider,
  .brand-tagline {
    display: none;
  }
  
  .product-name {
    font-size: 18px;
    letter-spacing: 2px;
  }
  
  .logo-icon {
    width: 36px;
    height: 36px;
    font-size: 20px;
  }
  
  .dashboard-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .dm-btn {
    justify-content: center;
  }
  
  .env-info-bar {
    padding: 12px 16px;
    gap: 12px;
  }
  
  .env-divider {
    display: none;
  }
  
  .footer-content {
    flex-direction: column;
    gap: 8px;
  }
  
  .footer-divider {
    display: none;
  }
}
</style>
