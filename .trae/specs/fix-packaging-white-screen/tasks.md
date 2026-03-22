# Tasks

- [x] Task 1: 修复 preload.js ESM 兼容性问题
  - [x] SubTask 1.1: 将 electron/preload.js 改为 ESM 语法（import/export）
  - [x] SubTask 1.2: 验证语法正确性

- [x] Task 2: 修复 electron-builder.yml 打包配置
  - [x] SubTask 2.1: 确保 dist 目录包含在打包文件中
  - [x] SubTask 2.2: 禁用 asar 避免路径问题（可选但推荐）
  - [x] SubTask 2.3: 清理旧的 extraResources 中关于 dist 的配置

- [x] Task 3: 修复 main.js 路径加载逻辑
  - [x] SubTask 3.1: 简化路径查找逻辑
  - [x] SubTask 3.2: 确保指向正确的 dist 目录
  - [x] SubTask 3.3: 添加调试日志

- [x] Task 4: 验证 Vite 打包输出
  - [x] SubTask 4.1: 检查 dist/index.html 中的资源路径是否为相对路径
  - [x] SubTask 4.2: 如有必要，手动修改为相对路径

- [ ] Task 5: 清理旧产物并重新打包（需要管理员权限，请手动执行）
  - [ ] SubTask 5.1: 删除 release 目录
  - [ ] SubTask 5.2: 重新运行 npm run build:win
  - [ ] SubTask 5.3: 验证安装包能正常运行

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 2
- Task 5 depends on Task 4

# 手动执行步骤（在 PowerShell 管理员中运行）

```powershell
# 1. 进入项目目录
cd D:\APP0

# 2. 删除旧的 release 目录
Remove-Item -Recurse -Force release -ErrorAction SilentlyContinue

# 3. 重新构建 Vite（这会重新生成 dist，但会覆盖我们手动修改的 index.html）
npm run build

# 4. 关键：再次修改 dist/index.html 为相对路径
# 读取文件内容并替换
$content = Get-Content dist\index.html -Raw
$content = $content -replace 'src="/js/', 'src="./js/'
$content = $content -replace 'href="/js/', 'href="./js/'
$content = $content -replace 'href="/css/', 'href="./css/'
Set-Content dist\index.html $content -NoNewline

# 5. 验证修改
Get-Content dist\index.html | Select-String "src=\"./js"

# 6. 执行 Electron 打包
npx electron-builder --win

# 7. 等待打包完成，检查 release 目录
Get-ChildItem release\*.exe
```
