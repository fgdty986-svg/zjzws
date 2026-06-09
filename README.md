# NetCheck · 网络检测工具

测网速 · 查 IP 归属地 · 地图定位 · 历史记录。纯浏览器运行，附零依赖 Node 后端。

## 功能

- **测速**：下载、上传（需后端）、延迟 Ping、抖动 Jitter
- **IP 信息**：公网 IP、归属地、运营商、经纬度、时区
- **地图定位**：在地图上标出 IP 位置（OpenStreetMap，免费无需 Key）
- **本地信息**：局域网 IP、连接类型、系统、分辨率
- **历史记录**：每次测速自动存到浏览器本地，并算多次平均（最多 20 条）

## 三种使用方式

### 1. 本地双击打开（最简单）
直接双击 `index.html`。注意：`file://` 下检测不到后端，**上传测速会自动改用 Cloudflare 公共端点**；地图与 IP 查询正常。

### 2. 本地运行后端（上传测速最准）
需要 [Node.js](https://nodejs.org) 16+：

```powershell
cd D:\zjzws
node server.js
```

然后浏览器打开 http://localhost:8000 。此时上传/下载都测到你自己的服务器，最准确，也可供局域网内其他设备访问。

### 3. 部署成公开网站（给别人用）

#### 方式 A：Cloudflare Pages（推荐，免费）
1. 把本文件夹推到 GitHub 仓库
2. Cloudflare 控制台 → Pages → 连接该仓库
3. 构建命令留空，输出目录填 `/`（项目根）
4. 部署完成得到 `xxx.pages.dev` 网址

> 纯静态部署没有 Node 后端，上传测速会自动用 Cloudflare 公共端点，依然可用。

#### 方式 B：Vercel（免费）
```powershell
npm i -g vercel
cd D:\zjzws
vercel
```
按提示一路回车即可，已带 `vercel.json` 配置。

## 费用说明

| 项目 | 费用 |
|---|---|
| 托管（Cloudflare Pages / Vercel） | 免费 |
| 平台二级域名（xxx.pages.dev） | 免费 |
| 地图（OpenStreetMap / Leaflet） | 免费，无需 Key |
| IP 查询（ipapi.co） | 免费版约 1000 次/月 |
| 自定义域名（可选） | 约 ¥30–80/年 |

正常个人使用 **全程 0 元**。只有自定义域名或访问量极大时才可能产生费用。

## 文件结构

```
index.html    主页面（含全部前端逻辑）
favicon.svg   网站图标
server.js     零依赖 Node 后端（上传/下载/ping 端点 + 静态服务）
package.json  启动脚本
vercel.json   Vercel 部署配置
```
