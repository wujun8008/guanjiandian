# 关键点 · 开发纪要（Handoff）

> 把这次开发的过程、决策与现状提炼成一份可以"接着做"的说明。
> 最后更新：2026-10-14 ｜ 仓库：<https://github.com/wujun8008/guanjiandian>

---

## 0. 一句话

**关键点**：给小学四到六年级孩子练"读题理解"的小游戏。要解决的是——
孩子做错题往往不是不会，而是**没读懂题目在问什么**（语数外三科都有这个问题）。

玩法三步：

1. **划重点** —— 点题干里你认为关键的字词（荧光笔效果，可多选）；
2. **选意思** —— 从 4 个"这道题到底在问什么"里选一个：1 个正确 + 3 个**近似干扰项**；
3. **看批改** —— 按对错给出针对性建议：漏了哪个关键词、选错的意思错在哪、下次读题要注意什么。

覆盖 **语文 / 数学 / 英语**。

---

## 1. 需求与关键决策

最初用四个问题确认了方向：

| 问题 | 决定 |
|---|---|
| 交付形式 | **完整前端项目**（React + Vite + TS），不是单个 HTML |
| AI 接入方式 | **OpenAI 兼容接口**（Base URL + Key + Model，存 localStorage） |
| 目标年级 | **小学四到六年级** |
| 题库来源 | 以 **AI 实时生成为主** |

其中「AI 后加」和「完全靠 AI 实时生成」两处看似矛盾，最终落地方案是：
**内容以 AI 实时生成为主，但内置题库兜底**——没配 Key 也能立刻玩、也能测试；
AI 那层代码完整写好，接上 Key 即生效，不是空接口。

后续又追加了两轮需求：

- **各学科所有题型都要有分类专项训练** → 建立"题型体系"，加「专项训练 + 难度」筛选；
- **把进阶部分做出来** → 每个题型配「基础 / 进阶」两档。

---

## 2. 题型体系

每个学科 **5 个题型**（定义在 `src/data/curriculum.ts` 的 `CATEGORIES`）：

| 学科 | 题型 |
|---|---|
| 语文 | 概括题 · 词句理解 · 赏析题 · 按要求写句子 · 古诗文 |
| 数学 | 购物问题 · 面积与周长 · 单位换算 · 行程问题 · 多步应用题 |
| 英语 | 疑问词理解 · 句型要求 · 判断正误 · 词形填空 · 对话交际 |

内置题库共 **30 题**（15 题型 × 基础/进阶），全部手写。干扰项都对应具体的读题毛病：
看错范围 / 答非所问 / 只答一半 / 混淆概念。

---

## 3. 技术栈与常用命令

- **React 18 + Vite 5 + TypeScript**，无 UI 框架，样式全部手写在一个 `styles.css` 里。
- 开发：`pnpm install && pnpm dev` → <http://localhost:5199>
- 构建：`pnpm build`（= `tsc --noEmit && vite build`），产出 `dist/`
- 类型检查：`pnpm typecheck`
- 单文件版：仓库根目录的 `关键点.html`，内联打包，**双击即玩、离线可用**
- Docker：`docker compose up -d --build` → <http://localhost:8080>

---

## 4. 文件结构

```
src/
  App.tsx                # 主流程与状态（专项/难度筛选、统计、AI 调用）
  types.ts               # 数据模型（Question / Category / Keyword / Option / Token …）
  styles.css             # 全部样式（设计令牌 + 组件样式）
  data/
    curriculum.ts        # 题型体系（三科 × 5 题型）
    questions.ts         # 内置题库（15 题型 × 基础/进阶）+ 洗牌
  lib/
    tokenize.ts          # 把题干按关键词锚点切成可点击片段
    feedback.ts          # 批改引擎：判定对错、生成针对性建议
    ai.ts                # OpenAI 兼容客户端：出题 / 陪读问答 / 个性化点评
  components/
    Header.tsx           # 顶栏：品牌、学科切换、统计、设置
    FilterBar.tsx        # 专项训练（题型）+ 难度筛选
    StemCard.tsx         # 题干 + 荧光笔划重点
    Options.tsx          # 核心意思 4 选 1
    Feedback.tsx         # 批改结果与建议
    ChatDock.tsx         # 底部「问问 AI 老师」抽屉
    Settings.tsx         # AI 设置弹窗
Dockerfile               # 多阶段构建（node 构建 → nginx 托管）
nginx.conf               # 静态站点配置（gzip / 缓存 / SPA 回退）
docker-compose.yml       # 一键起容器
关键点.html               # 打包好的单文件版
```

---

## 5. 关键实现要点

### 数据模型（`src/types.ts`）

- `Question`：`stem`（题干原文）/ `keywords` / `options` / `category` / `difficulty` / `tip`
- `Keyword`：`text`（**必须与 stem 逐字一致**）/ `reason`（讲给孩子听）/ `role`
- `role` 决定反馈里给哪一类读题建议，取值：
  `task`（做什么）/ `object`（对象、范围）/ `data`（数据、单位）/
  `condition`（限制条件）/ `target`（最终要问的）/ `trap`（易漏的陷阱词）

### 分词（`src/lib/tokenize.ts`）

把题干按"关键词锚点"切成可点击片段：关键词从原文里精确切出，其余文字按标点切成自然短语。
**纯标点片段不可点击**（避免让孩子去点「。」这种）。

### 批改（`src/lib/feedback.ts`）

把"孩子点的词"和"题目的关键词"比对，算出漏选/误选，分四档（perfect / good / partial / poor）
给结论，并拼出针对性建议：漏了哪个关键词、选错的意思错在哪、按 `role` 给出读题方法。

### AI（`src/lib/ai.ts`）

OpenAI 兼容：`POST {baseUrl}/chat/completions`。三个能力：

- **实时出题**（可按当前题型生成）：让模型返回严格 JSON，前端 `validateQuestion` 校验后才用；
- **陪读问答**：底部「问问 AI 老师」，孩子向 AI 提问；
- **个性化点评**：针对本次作答给一段话。

配置（Base URL / Key / Model）存在浏览器 `localStorage`，Key 不上传。
面板里内置了 DeepSeek / 通义千问 / 智谱 GLM / Kimi / OpenAI 的快捷预设。

### 设计

隐喻是**作业纸 + 荧光笔**：方格纸底纹，点词 = 划荧光笔（带从左到右的书写动画），
批改用红笔、正确用绿笔。中文走系统字体栈，数字用 Fraunces；无网时回退，不影响使用。
无障碍：按钮有 `aria-pressed`、键盘可见焦点，尊重 `prefers-reduced-motion`。

---

## 6. 改代码必读的约定（坑）

- `keywords[].text` 必须与 `stem` **逐字一致**，否则不会被切出来高亮；
- `options` 恰好 4 个，且**有且仅有 1 个** `correct: true`；
- `category` 必须是 `curriculum.ts` 里的题型 `id`（新增题型在 `CATEGORIES` 里加）；
- 标点不参与点选；改题库后可跑一遍数据自检（关键词是否都在题干、答案是否唯一、题型覆盖）；
- AI 出题走浏览器直连服务商，**依赖服务商允许跨域（CORS）**；DeepSeek / OpenAI 一般没问题。

---

## 7. 已完成 & 已验证

- 全部功能 + 30 题题库（15 题型 × 基础/进阶）
- `typecheck` / `build` 通过
- **数据自检通过**：30 题、15 题型，关键词零错位、答案唯一、每题型基础+进阶齐全
- 截图确认：专项切换、进阶出题、批改反馈
- 单文件版从 `file://` 打开零报错
- 已推 GitHub；已加 Docker 部署

---

## 8. 下一步（还没做）

- **「挑战」难度**：目前只有基础/进阶，可补第三档；
- **按题型生成专项小练习**：错哪类就多练哪类；
- **家长看板**：记录各题型正确率随时间的变化；
- **GitHub Pages**：给孩子一个网址，平板/手机直接打开就玩；
- **后端代理**：部署到公网、给多人用、又想藏住 API Key 时，需要加一个小代理（这是唯一需要"改造"的场景）；
- 继续扩充题库（尤其把每个题型的难度层次拉开）。

---

## 9. 环境备注

- 本机：Node v24 / pnpm 11；Docker 构建用 `node:22-alpine`（Node ≥ 18 即可）。
- 本项目是**纯前端静态站点**，没有后端，Docker 部署只是"构建 + nginx 托管"，不需要改业务代码。
- 本地开发后要推代码：`git push`（origin 已配好）；或在别的环境重新 `git clone` 接着做。
