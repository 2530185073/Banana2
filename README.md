# Banana Image Studio

一个基于 Gemini API（3 Pro Image Preview & 2.5 Flash Image）的开源本地图像工作室：前端纯静态，Node 轻量反向代理，几分钟即可跑起来调试和演示。

## 功能特点
- 🎨 文本/多图参考生成：支持最多 14 张参考图，拖拽上传、缩略图预览、点击移除。
- 🔄 多轮记忆：可选择保留上一轮文本上下文，便于连续迭代细化画面。
- 🧭 模型/模式快捷切换：Pro 与 Flash 预设、响应模式 IMAGE / IMAGE+TEXT / TEXT；Flash 自动限制 1K 分辨率。
- 🧮 Token 预估与耗时：请求前估算 token；返回后展示真实用量（若 API 回传 usageMetadata）。
- 🚦 友好错误提示：代理解析错误信息并回显在 UI；预览折叠 base64，防止浏览器卡顿。
- 🔒 本地存储：API Key 仅保存在浏览器 localStorage，不会被服务器记录。

## 快速开始
1. 安装依赖（本项目无额外依赖，只需 Node >= 18）：
   ```bash
   cd /path/to/bananaimage
   npm install   # 目前只用于锁定元数据，可省略
   ```
2. 启动本地服务（默认端口 9868）：
   ```bash
   npm start
   ```
3. 打开 `http://localhost:9868`，在界面中填写：
   - Base 域名（例：`https://generativelanguage.googleapis.com` 或自建代理域）
   - 模型路径（例：`v1beta/models/gemini-3-pro-image-preview:generateContent`）
   - API Key（不会上传，可选“记住”保存到本地）
4. 输入提示词与参考图，点击“立即生成”。

## 目录结构
```
.
├── public/              # 前端页面静态资源
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── server.js            # 轻量静态文件+代理服务器
├── package.json
├── README.md
└── banana               # 示例/参考文档（非运行所需）
```

## 配置说明
- **Base / 模型路径**：完全手动输入，便于切换官方域或自定义网关。
- **生成张数**：已固定为 1 张，避免超量消耗。
- **分辨率与模型匹配**：选择 Flash 时会自动限制分辨率为 1K。
- **输出模式**：可切换 IMAGE / IMAGE+TEXT / TEXT，用于获取模型解释文字。

## 安全提示
- 勿将真实生产密钥提交到仓库或截图外泄。
- 如在公网部署，请在代理层增加鉴权 / 速率限制（当前示例仅演示用途）。

## 常见问题
- **预览很长/卡顿？** 已默认折叠参考图的 base64；如果仍卡，减少参考图或分辨率。
- **未返回图片？** 检查是否选择了 TEXT-only 模式，或请求被模型的安全策略拒绝（查看错误提示）。
- **CORS 问题？** 所有调用通过本地 `/proxy`，仅需确保浏览器访问同一域的 9868 端口。

## 自定义与二次开发建议
- 如需部署到云端，可将 `public/` 放入任意静态托管，将 `server.js` 部署为无服务器函数 / 轻量容器。
- 可在 `app.js` 的 `buildPayload` 中扩展更多 generationConfig，或加入 tools（如 google_search）。
- UI 纯 CSS，无构建步骤，直接修改 `public/styles.css` 即可。

## 许可证
MIT License

## 经济实惠的中转推荐
- 直接替换 Base 为 `https://api.zyai.online`，后台获取 Key 后即可使用。
- 价格：每张图片低至 **¥0.15**，显著低于官方 **$0.24**/张。
- 在界面可一键选择该中转，也可继续填写自定义 Base。
- 选择ZYAI后 可直接填写 sk-pNYQej3gfPbTdpPADbBb837dBcB0454dAe262c13E5E4D65d  体验使用
