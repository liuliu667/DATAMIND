# 修复打包后白屏问题 Spec

## Why
Electron 应用打包后出现白屏，控制台显示两个关键错误：
1. `preload.js` 无法加载：因为使用了 CommonJS `require()`，但 package.json 设置了 `"type": "module"`
2. 前端资源 `ERR_FILE_NOT_FOUND`：dist 目录路径配置错误，导致 chunk 文件无法加载

## What Changes
- 修复 preload.js：将 CommonJS 语法改为 ESM 语法，或重命名为 .cjs
- 修复 electron-builder.yml：确保 dist 目录正确打包到 resources/app/dist
- 修复 main.js：使用正确的路径加载 dist 资源
- 可选：禁用 asar 避免路径解析问题

## Impact
- Affected specs: Electron 主进程加载、资源打包配置
- Affected code: electron/preload.js, electron/main.js, electron-builder.yml

## ADDED Requirements
### Requirement: Preload 脚本兼容 ESM
The system SHALL ensure preload.js can be loaded in ESM context

#### Scenario: Success case
- **WHEN** Electron 加载 preload.js
- **THEN** 不报错，成功暴露 electronAPI 到渲染进程

### Requirement: Dist 资源正确打包
The system SHALL package dist folder to correct location

#### Scenario: Success case
- **WHEN** 应用打包后运行
- **THEN** 所有 js/css 资源能正确加载，无 404 错误

## MODIFIED Requirements
### Requirement: Electron Main Process
**Current**: preload.js 使用 require(), main.js 路径查找逻辑复杂
**Modified**: preload.js 改为 ESM 语法，main.js 使用简单可靠的路径逻辑

## REMOVED Requirements
None
