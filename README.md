# 🍌 Banana2 - Gemini 图像工作室

> 本地优先的 Gemini 图像生成工作室，内置本地代理免 CORS，支持多图参考、多轮提示，IMAGE/TEXT 双模式。

[![Node.js CI](https://github.com/2530185073/Banana2/actions/workflows/nodejs.yml/badge.svg)](https://github.com/2530185073/Banana2/actions/workflows/nodejs.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node version](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org/)

## ✨ 特性

- 🖼️ **多图拖拽** - 同时上传多张参考图
- 💬 **多轮对话** - 支持连续对话上下文
- 🔄 **双模式** - IMAGE 图生图 / TEXT 文生图
- 🎯 **Token 预估** - 实时显示 token 消耗
- 🛡️ **本地代理** - 内置代理免 CORS 限制
- 🚀 **快速启动** - 几分钟即可运行
- 🇨🇳 **中文界面** - 完整中文支持

## 🚀 快速开始

### 前置要求

- Node.js >= 18
- Gemini API Key（获取：https://aistudio.google.com/app/apikey）

### 安装运行

```bash
# 1. 克隆项目
git clone https://github.com/2530185073/Banana2.git
cd Banana2

# 2. 安装依赖（可选，仅开发需要）
npm install

# 3. 配置 API Key
cp .env.example .env
# 编辑 .env 填入你的 GEMINI_API_KEY

# 4. 启动服务
npm start

# 或使用 nodemon 开发模式（自动重载）
npm run dev
```

### 访问界面

打开浏览器访问：http://localhost:9868

## 📖 使用指南

### 基本用法

1. 打开页面后，拖拽图片到上传区域（或直接输入提示词）
2. 在提示框输入你的描述
3. 点击"生成"按钮
4. 等待几秒，查看生成的图片

### API 配置

在 `.env` 文件中配置：

```bash
# Gemini API Key（必填）
GEMINI_API_KEY=your_api_key_here

# 服务器端口（可选，默认 9868）
PORT=9868
```

### 支持的功能

- **Image-to-Image**: 上传图片 + 提示词生成新图片
- **Text-to-Image**: 仅提示词生成图片
- **多图参考**: 同时上传多张图片作为参考
- **多轮对话**: 基于之前的生成结果继续优化

## 🛠️ 开发

### 可用命令

```bash
# 生产模式
npm start

# 开发模式（自动重载）
npm run dev

# 代码检查
npm run lint

# 代码格式化
npm run format
```

### 项目结构

```
Banana2/
├── server.js          # Node.js 服务器（本地代理）
├── public/            # 前端静态文件
│   ├── index.html
│   ├── style.css
│   └── app.js
├── .env.example       # 环境变量模板
├── .env               # 实际环境变量（不提交）
└── package.json
```

## 📦 部署

### Vercel 一键部署

点击按钮即可部署：
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/2530185073/Banana2)

### Docker 部署

```bash
docker build -t banana2 .
docker run -p 9868:9868 -e GEMINI_API_KEY=your_key banana2
```

### 手动部署

1. 上传代码到服务器
2. 安装 Node.js 18+
3. 配置环境变量
4. 使用 PM2 管理进程：`pm2 start server.js --name banana2`

## ❓ FAQ

### Q: 如何获取 Gemini API Key？

访问 https://aistudio.google.com/app/apikey 免费获取。

### Q: 为什么图片无法加载？

可能是 CORS 问题。请确保通过本地代理访问，不要直接调用 Gemini API。

### Q: 支持哪些图片格式？

支持 JPG、PNG、WebP 格式，单张最大 10MB。

### Q: 生成图片需要多长时间？

通常 3-10 秒，取决于网络状况和模型负载。

### Q: 可以在手机上使用吗？

可以，界面已适配移动端。

## 📄 License

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 📬 联系方式

- 项目 Issues: https://github.com/2530185073/Banana2/issues
- 作者 GitHub: https://github.com/2530185073

## 🙏 致谢

- [Google Generative AI](https://ai.google.dev/) - Gemini API
- [OpenClaw](https://github.com/openclaw/openclaw) - AI 助手框架

---

<div align="center">

**如果这个项目对你有帮助，请给一个 ⭐️ Star！**

Made with ❤️ by @2530185073

</div>
