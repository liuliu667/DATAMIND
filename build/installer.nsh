; NSIS 安装程序自定义脚本
; DataMind V1.0 安装程序

; 请求管理员权限
RequestExecutionLevel admin

; 设置默认安装目录为 Program Files
InstallDir "$PROGRAMFILES64\DataMind"

!macro customHeader
  ; 设置安装程序标题（不重复定义 Name，由 electron-builder 控制）
  ; Name "DataMind V1.0"  <- 删除这行，避免重复定义
!macroend

!macro customInstall
  ; 安装完成后显示完成页面
  DetailPrint "DataMind V1.0 安装完成"
!macroend

!macro customUnInstall
  ; 卸载时清理用户数据（可选）
  MessageBox MB_YESNO "是否同时删除用户数据？" IDNO skipDeleteData
  RMDir /r "$LOCALAPPDATA\datamind"
skipDeleteData:
!macroend
