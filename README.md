# Toc Rock

PDF 分割与目录工具 - Apple 风格极简设计的 Electron 桌面应用。

## 功能特性

- 🔪 **PDF 分割** - 选择页码范围，导出为新 PDF
- 📑 **AI 目录识别** - 使用 AI 自动识别目录结构
- ✏️ **目录编辑** - 手动调整目录条目
- 📥 **目录写入** - 将目录嵌入 PDF 文件

## 技术栈

- Electron 28
- React 18
- Vite 5
- PDF.js & pdf-lib
- Framer Motion

## 开发

```bash
# 安装依赖
npm install

# 开发模式
npm run electron:dev

# 仅运行 Web 版本
npm run dev
```

## 构建

```bash
# 构建 Mac 应用 (Apple Silicon)
npm run build:mac
```

构建产物位于 `release/` 目录。

## 许可证

MIT
