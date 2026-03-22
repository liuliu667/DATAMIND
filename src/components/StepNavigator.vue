<template>
  <div class="step-navigator">
    <div class="step-progress-bar">
      <div 
        class="progress-fill" 
        :style="{ width: progressPercentage + '%' }"
      />
    </div>
    
    <div class="steps-container">
      <div
        v-for="(step, index) in steps"
        :key="step.id"
        class="step-item"
        :class="{
          'is-active': index === currentStep,
          'is-completed': index < currentStep,
          'is-clickable': index < currentStep && allowBack
        }"
        @click="handleStepClick(index)"
      >
        <div class="step-icon-wrapper">
          <div class="step-icon">
            <el-icon v-if="index < currentStep" class="check-icon">
              <Check />
            </el-icon>
            <el-icon v-else-if="index === currentStep" class="active-icon">
              <component :is="step.icon" />
            </el-icon>
            <span v-else class="step-number">{{ index + 1 }}</span>
          </div>
          <div v-if="index < steps.length - 1" class="step-line" />
        </div>
        
        <div class="step-content">
          <div class="step-title">{{ step.title }}</div>
          <div class="step-description">{{ step.description }}</div>
        </div>
        
        <el-tooltip
          v-if="index < currentStep && allowBack"
          content="点击返回此步骤"
          placement="bottom"
        >
          <div class="back-hint">
            <el-icon><ArrowLeft /></el-icon>
          </div>
        </el-tooltip>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Check, ArrowLeft } from '@element-plus/icons-vue'

const props = defineProps({
  steps: {
    type: Array,
    required: true,
    validator: (steps) => steps.every(s => s.id && s.title)
  },
  currentStep: {
    type: Number,
    required: true,
    validator: (val) => val >= 0
  },
  allowBack: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['step-click'])

const progressPercentage = computed(() => {
  if (props.steps.length <= 1) return 0
  return (props.currentStep / (props.steps.length - 1)) * 100
})

function handleStepClick(index) {
  if (index < props.currentStep && props.allowBack) {
    emit('step-click', index)
  }
}
</script>

<style scoped>
.step-navigator {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 28px 40px;
  box-shadow: 
    0 4px 6px -1px rgba(0, 0, 0, 0.05),
    0 2px 4px -1px rgba(0, 0, 0, 0.03),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  margin-bottom: 32px;
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.step-progress-bar {
  height: 6px;
  background: linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 100%);
  border-radius: 3px;
  margin-bottom: 24px;
  overflow: hidden;
  position: relative;
}

.step-progress-bar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%);
  animation: shimmer 2s infinite;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 50%, #667eea 100%);
  background-size: 200% 100%;
  border-radius: 3px;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  animation: gradient-flow 3s ease infinite;
  position: relative;
  z-index: 1;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 20px;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4));
  border-radius: 0 3px 3px 0;
}

.steps-container {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.step-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  position: relative;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.step-item.is-clickable {
  cursor: pointer;
}

.step-item.is-clickable:hover {
  transform: translateY(-2px);
}

.step-item.is-clickable:hover .step-icon {
  transform: scale(1.15);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.35);
}

.step-icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
}

.step-icon {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 2;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  color: #94a3b8;
  border: 2px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.step-item.is-active .step-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
  animation: pulse-glow 2s ease-in-out infinite;
}

.step-item.is-completed .step-icon {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
}

.step-item.is-completed.is-clickable:hover .step-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.35);
}

.step-line {
  position: absolute;
  left: 50%;
  top: 50%;
  width: calc(100% + 40px);
  height: 3px;
  background: linear-gradient(90deg, #e2e8f0 0%, #e2e8f0 100%);
  transform: translateY(-50%);
  z-index: 1;
  border-radius: 2px;
  transition: all 0.4s ease;
}

.step-item.is-completed .step-line {
  background: linear-gradient(90deg, #10b981 0%, #10b981 100%);
}

.step-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.step-title {
  font-size: 15px;
  font-weight: 600;
  color: #64748b;
  transition: all 0.3s ease;
  letter-spacing: 0.3px;
}

.step-item.is-active .step-title {
  color: #5b6af5;
  font-weight: 700;
}

.step-item.is-completed .step-title {
  color: #059669;
  font-weight: 600;
}

.step-description {
  font-size: 12px;
  color: #94a3b8;
  max-width: 120px;
  line-height: 1.4;
  font-weight: 400;
}

.back-hint {
  position: absolute;
  top: -6px;
  right: 15%;
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 11px;
  opacity: 0;
  transform: translateY(10px) scale(0.8);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  z-index: 3;
}

.step-item.is-completed.is-clickable:hover .back-hint {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.check-icon {
  font-size: 24px;
}

.active-icon {
  font-size: 22px;
  animation: gentle-rotate 4s linear infinite;
}

.step-number {
  font-size: 18px;
  font-weight: 700;
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
  }
  50% {
    box-shadow: 0 8px 32px rgba(102, 126, 234, 0.6);
  }
}

@keyframes gradient-flow {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

@keyframes gentle-rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 响应式适配 */
@media (max-width: 768px) {
  .step-navigator {
    padding: 20px 16px;
    border-radius: 16px;
  }
  
  .steps-container {
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .step-item {
    flex: 0 0 calc(50% - 8px);
  }
  
  .step-line {
    display: none;
  }
  
  .step-description {
    display: none;
  }
  
  .step-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
  }
  
  .step-title {
    font-size: 13px;
  }
}
</style>
