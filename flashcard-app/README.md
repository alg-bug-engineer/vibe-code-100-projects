# 儿童英语图片发音卡片（Web）

一个纯前端的小应用：网格展示单词卡片，点击图片即可播放发音，支持按分类筛选，非常适合少儿启蒙或自学。

## 预览与运行

方式 A：直接打开
- 用浏览器直接打开 `index.html`

方式 B：本地静态服务器（推荐）

```bash
python3 -m http.server 8000
# 浏览器访问 http://localhost:8000/flashcard-app/
```

## 功能

- 网格布局，自适应多端
- 点击卡片播放对应音频
- 顶部分类按钮，一键筛选

## 目录结构

- `index.html`：页面入口
- `data.js`：卡片数据源（图片/音频/分类）
- `script.js`：渲染卡片、播放音频、分类逻辑
- `style.css`：样式
- `images/`：图片资源
- `audio/`：音频资源（mp3 等）

## 如何新增卡片

在 `data.js` 的 `cardData` 数组中新增一个对象：

```js
{
  id: 7,
  word: 'apple',
  image: 'images/apple.jpg',
  audio: 'audio/apple.mp3',
  category: 'Fruits'
}
```

- 将对应图片放到 `images/`
- 将发音音频放到 `audio/`
- `category` 将自动出现在顶部分类按钮中

## 自定义样式

- 基础配色与卡片尺寸在 `style.css` 中配置
- 如需显示单词文字，`script.js` 中有注释示例（`.word` 元素）

## 部署

这是一个静态站点，任意静态托管均可：GitHub Pages、Vercel、Netlify、阿里云 OSS、腾讯云 COS 等。
