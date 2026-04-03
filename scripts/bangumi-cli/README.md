# Bangumi CLI - 动画信息抓取工具

独立的命令行工具，用于从 Bangumi 抓取动画信息并生成 Markdown 笔记。

## 安装

```bash
cd scripts/bangumi-cli
npm install
```

## 使用方法

### 交互模式

```bash
node bangumi-cli.js
```

程序会提示你输入动画名称，然后从搜索结果中选择。

### 直接指定名称

```bash
node bangumi-cli.js "咒术回战"
```

### 指定观看状态

```bash
node bangumi-cli.js "葬送的芙莉莲" --state "在看"
```

### 批量处理

```bash
node bangumi-cli.js --batch "咒术回战,葬送的芙莉莲,地狱乐"
```

### 输出 JSON 格式

```bash
node bangumi-cli.js "咒术回战" --json
```

### 指定输出目录

```bash
node bangumi-cli.js "咒术回战" --output "./my-notes"
```

## 命令行参数

| 参数 | 简写 | 说明 |
|------|------|------|
| `[name]` | - | 动画名称 |
| `--state` | `-s` | 观看状态 (已看/在看/想看/抛弃) |
| `--catego` | `-c` | 改编类型 |
| `--batch` | `-b` | 批量处理，多个名称用逗号分隔 |
| `--output` | `-o` | 输出目录 |
| `--json` | `-j` | 输出 JSON 格式 |

## 输出示例

生成的 Markdown 文件：

```markdown
---
中文名: "咒术回战"
日文名: "呪術廻戦"
cover: "https://..."
改编类型: "漫画改编"
总集数: "24"
观看状态: "想看"
制作公司: "MAPPA"
...

---

**已观看集数**： 0
**观看网址**： 

# 动画信息
...
```

## API 集成

可以通过 Node.js 直接调用：

```javascript
const { getAnimeByUrl, generateMarkdown } = require('./bangumi-cli');

async function main() {
    const info = await getAnimeByUrl('https://bgm.tv/subject/40748');
    const { content } = generateMarkdown(info, { state: '想看' });
    console.log(content);
}

main();
```

## 注意事项

- 请求频率过高可能被 Bangumi 限制，批量处理时会有 1 秒延迟
- 部分动画可能没有封面图片，会使用占位图
- Netaba 评分趋势功能需要额外请求，当前版本未启用
