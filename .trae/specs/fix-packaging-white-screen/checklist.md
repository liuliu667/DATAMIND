# Checklist

- [ ] preload.js 使用 ESM 语法（import/export），无 require/module.exports
- [ ] electron-builder.yml 正确配置 files 包含 dist 目录
- [ ] electron-builder.yml 禁用 asar（asar: false）
- [ ] main.js 使用简单路径逻辑加载 dist/index.html
- [ ] dist/index.html 中资源路径为相对路径（./js/xxx.js）
- [ ] 打包后安装/运行无白屏
- [ ] 控制台无 ERR_FILE_NOT_FOUND 错误
- [ ] 控制台无 preload 加载错误
