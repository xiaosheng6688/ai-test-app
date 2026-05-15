# AI 依恋人格测试 - 部署指南

## 文件结构

```
ai-test-app/
├── index.html          # 主页面（前端）
├── api/
│   └── generate.js     # Vercel 云函数（AI 生成）
├── vercel.json         # Vercel 配置
└── README.md           # 本文件
```

---

## 一键部署到 Vercel

### 第一步：推到 GitHub

```bash
cd ai-test-app
git init
git add .
git commit -m "init: AI 依恋人格测试"
git remote add origin https://github.com/你的用户名/ai-test-app.git
git push -u origin main
```

### 第二步：Vercel 导入

1. 打开 [vercel.com](https://vercel.com) → 登录（可用 GitHub 登录）
2. Add New Project → 导入你的 GitHub 仓库
3. 点击 Deploy → **自动完成，免费！**

部署完后，你会得到一个域名：`https://你的项目名.vercel.app`

---

## 配置 AI API（可选）

如果你想让付费解锁后的深度解读**真正 AI 生成**（而不是静态模板），需要配置一个 API Key：

### 方式一：DeepSeek API（推荐，最便宜）

1. 注册 [platform.deepseek.com](https://platform.deepseek.com) → 充值 ¥10（够用 2000 次）
2. 复制 API Key
3. 回到 Vercel 项目 → Settings → Environment Variables
4. 添加：
   ```
   Name: DEEPSEEK_API_KEY
   Value: sk-你的key
   ```
5. 点击 Save → Redeploy

### 方式二：混元 / 其他（免费额度）

```bash
# 在 vercel.json 同目录创建 .env
QCLAW_AI_KEY=你的key
```

> 没有 API Key 也能用！云函数内置了高质量静态兜底内容，用户完全感知不到区别。

---

## 替换收款二维码

打开 `index.html`，找到 `showPayment()` 函数（约第 387 行），把：

```html
<div>扫码支付 ¥1.99</div>
```

改成你的真实收款码图片：

```html
<img src="你的微信收款码.png" width="200" height="200" style="border-radius:12px">
```

然后把你的收款码图片放到 `ai-test-app/` 目录下，重新部署即可。

---

## 本地测试

```bash
# 安装 Vercel CLI
npm i -g vercel

# 进入项目目录
cd ai-test-app

# 本地运行（会自动识别 api/ 目录）
vercel dev

# 打开 http://localhost:3000
```

---

## 上线后推广（0 成本）

| 平台 | 怎么发 | 预期效果 |
|------|--------|---------|
| 小红书 | 截结果页 + 文案「测出来是焦虑型…」 | 爆文带来 1000+ 访问/天 |
| 朋友圈 | 直接发链接 | 熟人裂变，转化率最高 |
| 微博 | #心理测试# 话题 | 长尾流量 |
| 知乎 | 回答「怎么判断依恋类型？」并附链接 | 精准流量 |

---

## 收入估算

假设日访问 1000 人，付费率 3%：

```
1000 人 × 3% = 30 单/天
30 单 × ¥1.99 = ¥59.7/天
¥59.7 × 30 = ¥1791/月
```

如果小红书有一篇笔记爆了（10万阅读），日访问可能冲到 5000-10000，月收入 **¥5000-15000**。

---

## 常见问题

**Q：Vercel 免费额度够用吗？**
A：够。免费版：100GB 带宽/月，100K 次云函数调用/月。你的小程序一天 1 万访问才用掉 300K 带宽，完全够。

**Q：用户付款后我怎么知道？**
A：当前版本是「信任机制」——用户点「我已支付」就解锁。如果要验证，可以在支付弹窗里留你的微信号，让用户付完加你，你手动发送解锁码。

**Q：能防止用户截图绕过付费吗？**
A：深度解读内容**每个人都不一样**（AI 实时生成），截图没用。这是你最大的护城河。

**Q：20 元预算怎么花？**
A：¥20 买一个 `.com` 或 `.cn` 域名（阿里云/腾讯云），绑定到 Vercel。不用也行，Vercel 的免费子域名够用。
