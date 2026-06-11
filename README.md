# AI 语音绘图工具

纯语音控制的浏览器端绘图应用。无需鼠标键盘，用中文语音指令完成图形创建、修改、布局和导出。

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置 API Key
cp .env.example .env
# 编辑 .env，填入你的 OpenAI 兼容 API Key：
#   VITE_LLM_API_KEY=sk-xxx
#   VITE_LLM_BASE_URL=https://api.openai.com/v1
#   VITE_LLM_MODEL=gpt-4o

# 3. 启动
npm run dev
# 浏览器打开 http://localhost:3000
```

> 支持任何 OpenAI 兼容接口（如 DeepSeek、通义千问、本地 Ollama 等），只需改 `VITE_LLM_BASE_URL` 和 `VITE_LLM_MODEL`。

## 使用方式

1. 点击绿色 **麦克风按钮**（或按空格键）
2. 用中文说出绘图指令
3. 等待 AI 理解并执行，画布上实时呈现结果

### 支持的语音指令

| 类别 | 示例 |
|------|------|
| **创建图形** | "在中间画一个红色的圆"、"画一个蓝色长方形" |
| **空间定位** | "在左上角画个三角形"、"把圆往右移一点" |
| **修改图形** | "把它涂成黄色"、"放大两倍"、"删掉那个矩形" |
| **上下文引用** | "红色的那个放大"、"第三个变小"、"全部删除" |
| **复合指令** | "画一个房子"、"画一个笑脸"、"画一棵树"、"画一个城堡" |
| **自由线条** | "从左上到右下画一条线"、"画一个S形曲线" |
| **画布控制** | "清空画布"、"撤销"、"背景色改为蓝色" |
| **导出** | "保存"、"导出图片" |

### 复合指令支持的图形

房子、城堡、树、太阳、月亮、云朵、花、山、笑脸、哭脸、心形、五角星、汽车、船、火箭、雪人、机器人、时钟、雨伞、鱼、红绿灯等

## 技术架构

```
语音输入 (Web Speech API + Whisper 兜底)
    ↓
NLU Agent (LLM, 维护画布状态 + 对话历史)
    ↓
绘图引擎 (Fabric.js Canvas, 10种原子操作)
    ↓
反馈 (TTS 语音确认 + 视觉高亮 + 状态栏)
```

- **前端**: React 18 + TypeScript + Vite
- **画布**: Fabric.js 6
- **语音识别**: Web Speech API（主）+ OpenAI Whisper API（低置信度兜底）
- **语义理解**: OpenAI 兼容 LLM（GPT-4o / Claude / DeepSeek 等）
- **语音合成**: Web Speech Synthesis API

## 项目结构

```
src/
├── engine/
│   ├── operations.ts      # 类型定义和原子操作 schema
│   ├── stateManager.ts    # 元素状态 + 撤销/重做栈
│   └── canvasEngine.ts    # Fabric.js 封装，操作执行
├── speech/
│   ├── speechRecognition.ts  # Web Speech API 封装
│   ├── cloudStt.ts        # 云端 Whisper STT 兜底
│   └── types.ts
├── nlu/
│   ├── agent.ts           # LLM 调用 + context 管理
│   ├── prompt.ts          # 系统提示词
│   └── schema.ts          # 操作 schema + 复合指令模板
├── feedback/
│   └── tts.ts             # TTS 语音反馈
├── components/
│   ├── Canvas.tsx          # 画布组件
│   ├── MicButton.tsx       # 麦克风按钮
│   ├── UndoRedoButtons.tsx # 撤销/重做按钮
│   ├── StatusBar.tsx       # 状态栏
│   └── CommandLog.tsx      # 指令历史
└── App.tsx                 # 顶层集成
```

## 浏览器兼容性

需要支持 Web Speech API 的浏览器：Chrome、Edge、Safari。Firefox 不支持 Web Speech API。云端兜底需要麦克风权限。
