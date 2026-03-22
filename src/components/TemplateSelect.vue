<template>
  <div class="template-select">
    <div class="section-header">
      <div class="header-badge">
        <el-icon><Grid /></el-icon>
      </div>
      <div class="header-content">
        <h2 class="section-title">选择分析模板</h2>
        <p class="section-subtitle">根据您的数据类型选择合适的分析模板，系统将自动匹配最佳分析维度</p>
      </div>
    </div>

    <div class="template-grid">
      <div
        v-for="(template, index) in templates"
        :key="template.id"
        class="template-card-wrapper"
        :style="{ '--delay': `${index * 0.1}s` }"
      >
        <div
          class="template-card"
          :class="{ 'is-selected': selectedId === template.id }"
          @click="selectTemplate(template)"
        >
          <div class="card-glow" v-if="selectedId === template.id"></div>
          <div class="card-content">
            <div class="template-icon-wrapper" :class="`icon-${template.id}`">
              <el-icon :size="32">
                <component :is="getIcon(template.icon)" />
              </el-icon>
            </div>
            <div class="template-info">
              <h3 class="template-name">{{ template.name }}</h3>
              <p class="template-description">{{ template.description }}</p>
              <div class="template-fields">
                <div class="field-tag required">
                  <el-icon><Key /></el-icon>
                  <span>需: {{ getRequiredFieldsText(template) }}</span>
                </div>
              </div>
            </div>
            <div v-if="selectedId === template.id" class="selected-indicator">
              <div class="indicator-ring"></div>
              <el-icon class="check-icon"><Check /></el-icon>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="template-actions">
      <el-button class="dm-btn dm-btn-secondary" @click="handleBack">
        <el-icon><ArrowLeft /></el-icon>
        上一步
      </el-button>
      <el-button
        class="dm-btn dm-btn-primary"
        :disabled="!selectedId"
        :class="{ 'is-disabled': !selectedId }"
        @click="handleNext"
      >
        下一步
        <el-icon class="el-icon--right"><ArrowRight /></el-icon>
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Check, ArrowLeft, ArrowRight, Trophy, Goods, UserFilled, MapLocation, Grid, Key } from '@element-plus/icons-vue'
import { templates } from '../config/templates.js'
import { useMappingStore } from '../stores/mapping.js'

const emit = defineEmits(['back', 'next'])

const mappingStore = useMappingStore()
const selectedId = ref(null)

const iconMap = {
  Trophy,
  Goods,
  UserFilled,
  MapLocation
}

function getIcon(iconName) {
  return iconMap[iconName] || Trophy
}

function getRequiredFieldsText(template) {
  return template.requiredFields.map(f => f.label).join('、')
}

function selectTemplate(template) {
  selectedId.value = template.id
  mappingStore.setTemplate(template)
}

function handleBack() {
  emit('back')
}

function handleNext() {
  if (selectedId.value) {
    emit('next')
  }
}
</script>

<style scoped>
.template-select {
  padding: 0;
}

.section-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 32px;
}

.header-badge {
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

.header-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.section-title {
  font-size: 22px;
  font-weight: 700;
  margin: 0;
  color: #1e293b;
  letter-spacing: 0.3px;
}

.section-subtitle {
  font-size: 14px;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}

.template-card-wrapper {
  animation: fade-in-up 0.5s ease forwards;
  animation-delay: var(--delay);
  opacity: 0;
  transform: translateY(20px);
}

.template-card {
  position: relative;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border: 2px solid transparent;
  box-shadow: 
    0 4px 6px -1px rgba(0, 0, 0, 0.05),
    0 2px 4px -1px rgba(0, 0, 0, 0.03);
  overflow: hidden;
}

.template-card:hover {
  transform: translateY(-4px);
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.1),
    0 8px 16px rgba(0, 0, 0, 0.05);
  border-color: rgba(102, 126, 234, 0.2);
}

.template-card.is-selected {
  border-color: #667eea;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
}

.card-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(102, 126, 234, 0.15) 0%, transparent 70%);
  animation: glow-rotate 4s linear infinite;
  pointer-events: none;
}

.card-content {
  position: relative;
  z-index: 1;
  padding: 28px;
  display: flex;
  align-items: flex-start;
  gap: 20px;
}

.template-icon-wrapper {
  flex-shrink: 0;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
  color: #fff;
  font-size: 28px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.template-card:hover .template-icon-wrapper {
  transform: scale(1.1) rotate(5deg);
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
  margin: 0 0 10px 0;
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: 0.3px;
}

.template-description {
  margin: 0 0 14px 0;
  font-size: 14px;
  color: #64748b;
  line-height: 1.6;
}

.template-fields {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.field-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
}

.field-tag.required {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
}

.field-tag .el-icon {
  font-size: 12px;
}

.selected-indicator {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 28px;
  height: 28px;
}

.indicator-ring {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 2px solid #667eea;
  border-radius: 50%;
  animation: ring-pulse 2s ease-out infinite;
}

.check-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 14px;
  color: #667eea;
  font-weight: bold;
}

.template-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding-top: 24px;
  border-top: 1px solid #e2e8f0;
}

.dm-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 32px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 15px;
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

.dm-btn-primary.is-disabled {
  background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
  color: #94a3b8;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes glow-rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes ring-pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(1.8);
    opacity: 0;
  }
}

/* 响应式适配 */
@media (max-width: 768px) {
  .template-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .section-header {
    margin-bottom: 24px;
  }
  
  .section-title {
    font-size: 20px;
  }
  
  .card-content {
    padding: 20px;
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .template-icon-wrapper {
    width: 56px;
    height: 56px;
    font-size: 24px;
  }
  
  .template-actions {
    flex-direction: column;
    gap: 12px;
  }
  
  .template-actions .dm-btn {
    justify-content: center;
    width: 100%;
  }
}
</style>
