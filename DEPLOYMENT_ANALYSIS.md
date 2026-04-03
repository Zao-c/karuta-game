# 服务器部署问题分析与改进方案

## 当前架构分析

### 现有技术栈
- **前端**: Next.js 14 + React 18 + TypeScript
- **状态管理**: React useState + localStorage
- **房间同步**: BroadcastChannel API + localStorage
- **数据存储**: 纯客户端 localStorage

### 当前同步机制
```
用户A浏览器 <--BroadcastChannel--> 用户A其他标签页
     ↓ localStorage
用户A本地数据（独立）

用户B浏览器 <--BroadcastChannel--> 用户B其他标签页
     ↓ localStorage  
用户B本地数据（独立）

❌ 用户A和用户B无法通信！
```

---

## 问题一：localStorage 跨设备同步问题

### 问题描述
- localStorage 是浏览器本地存储，每个设备/浏览器独立
- 用户A创建房间，数据只存在用户A的浏览器中
- 用户B无法看到用户A创建的房间
- 用户数据（头像、歌牌组）无法跨设备同步

### 影响范围
- ❌ 房间创建/加入功能完全失效
- ❌ 用户配置无法跨设备使用
- ❌ 自定义歌牌组无法共享

---

## 问题二：BroadcastChannel 跨设备通信限制

### 问题描述
- BroadcastChannel 只能在同一浏览器的不同标签页间通信
- 无法实现跨设备、跨浏览器的实时通信
- 多人游戏场景完全无法工作

### 影响范围
- ❌ 房间状态同步失效
- ❌ 玩家加入/离开通知失效
- ❌ 游戏进度同步失效
- ❌ 实时游戏体验无法实现

---

## 问题三：缺少后端服务

### 问题描述
- 当前是纯前端应用，没有服务器端支持
- 无法实现真正的多人联机功能
- 无法持久化数据到数据库

### 影响范围
- ❌ 用户账号系统无法实现
- ❌ 数据持久化无法保证
- ❌ 安全性无法保障

---

## 改进方案

### 方案一：WebSocket 实时通信（推荐）

#### 架构设计
```
用户A浏览器 <--WebSocket--> 服务器 <--WebSocket--> 用户B浏览器
                              ↓
                          数据库
```

#### 技术选型
- **后端框架**: Node.js + Express 或 Next.js API Routes
- **WebSocket库**: Socket.io（推荐）或 ws
- **数据库**: PostgreSQL + Prisma 或 MongoDB
- **部署**: Vercel + Supabase 或自建服务器

#### 需要实现的功能
1. **房间管理服务**
   - 创建房间
   - 加入房间
   - 离开房间
   - 房间列表查询

2. **实时同步服务**
   - 玩家状态同步
   - 游戏进度同步
   - 聊天消息同步

3. **用户认证服务**
   - 用户注册/登录
   - 会话管理
   - 权限控制

4. **数据持久化**
   - 用户配置存储
   - 歌牌组存储
   - 游戏记录存储

---

### 方案二：使用 Firebase Realtime Database

#### 优点
- 无需自建后端
- 实时同步开箱即用
- 用户认证集成

#### 缺点
- 依赖第三方服务
- 免费额度有限
- 数据迁移困难

---

### 方案三：使用 Supabase

#### 优点
- 开源替代方案
- PostgreSQL 数据库
- 实时订阅功能
- 用户认证集成
- 免费额度较大

#### 推荐指数：⭐⭐⭐⭐⭐

---

## 任务分解

### 阶段一：后端基础搭建（预计2-3天）
- [ ] 创建 Supabase 项目
- [ ] 设计数据库表结构
- [ ] 实现用户认证API
- [ ] 实现房间管理API

### 阶段二：实时通信实现（预计2-3天）
- [ ] 集成 Supabase Realtime
- [ ] 实现房间状态同步
- [ ] 实现玩家状态同步
- [ ] 实现游戏进度同步

### 阶段三：数据持久化（预计1-2天）
- [ ] 用户配置云端存储
- [ ] 歌牌组云端存储
- [ ] 游戏记录存储

### 阶段四：前端适配（预计2-3天）
- [ ] 替换 localStorage 为 API 调用
- [ ] 替换 BroadcastChannel 为 Realtime 订阅
- [ ] 添加登录/注册界面
- [ ] 添加加载状态处理

### 阶段五：测试与部署（预计1-2天）
- [ ] 多设备联机测试
- [ ] 性能优化
- [ ] 部署到生产环境
- [ ] 监控与日志

---

## 数据库设计

### 用户表 (users)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  display_name VARCHAR(50) NOT NULL,
  avatar TEXT,
  bio TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 房间表 (rooms)
```sql
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(8) UNIQUE NOT NULL,
  host_id UUID REFERENCES users(id),
  game_mode INTEGER DEFAULT 0,
  game_phase INTEGER DEFAULT 0,
  deck_type VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  game_ended_at TIMESTAMP
);
```

### 玩家表 (room_players)
```sql
CREATE TABLE room_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  name VARCHAR(50),
  avatar TEXT,
  is_host BOOLEAN DEFAULT FALSE,
  is_observer BOOLEAN DEFAULT FALSE,
  is_ready BOOLEAN DEFAULT FALSE,
  score INTEGER DEFAULT 0,
  seat_index INTEGER
);
```

### 歌牌组表 (decks)
```sql
CREATE TABLE decks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  cards JSONB NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  play_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## API 设计

### 认证相关
```
POST /api/auth/register  - 用户注册
POST /api/auth/login     - 用户登录
POST /api/auth/logout    - 用户登出
GET  /api/auth/me        - 获取当前用户
```

### 房间相关
```
POST /api/rooms          - 创建房间
GET  /api/rooms          - 获取房间列表
GET  /api/rooms/:code    - 获取房间详情
POST /api/rooms/:code/join   - 加入房间
POST /api/rooms/:code/leave  - 离开房间
POST /api/rooms/:code/ready  - 准备/取消准备
DELETE /api/rooms/:code      - 解散房间
```

### 歌牌组相关
```
GET  /api/decks          - 获取用户歌牌组
POST /api/decks          - 创建歌牌组
PUT  /api/decks/:id      - 更新歌牌组
DELETE /api/decks/:id    - 删除歌牌组
GET  /api/decks/public   - 获取公开歌牌组
```

---

## Realtime 订阅设计

### 房间状态频道
```typescript
// 订阅房间变化
supabase
  .channel(`room:${roomId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'room_players',
    filter: `room_id=eq.${roomId}`
  }, handlePlayerChange)
  .subscribe()
```

### 游戏状态频道
```typescript
// 订阅游戏事件
supabase
  .channel(`game:${roomId}`)
  .on('broadcast', { event: 'game_event' }, handleGameEvent)
  .subscribe()
```

---

## 部署建议

### 推荐方案：Vercel + Supabase

#### Vercel 部署
```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel --prod
```

#### 环境变量配置
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 备选方案：自建服务器

#### Docker 部署
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 测试计划

### 单元测试
- [ ] API 接口测试
- [ ] 数据库操作测试
- [ ] 认证流程测试

### 集成测试
- [ ] 房间创建/加入流程
- [ ] 游戏流程测试
- [ ] 实时同步测试

### 多设备测试
- [ ] 不同浏览器测试
- [ ] 不同设备测试
- [ ] 网络延迟测试
- [ ] 断线重连测试

### 压力测试
- [ ] 多房间并发测试
- [ ] 多玩家同时在线测试
- [ ] 数据库性能测试

---

## 总结

当前网站是一个优秀的本地演示版本，但要部署到服务器供多人远程访问，需要进行以下核心改造：

1. **必须实现**：后端服务 + 数据库 + 实时通信
2. **推荐方案**：Supabase（后端即服务）
3. **预计工期**：8-13天
4. **技术难度**：中等

建议优先完成歌牌组导入功能和猜歌模式设计，然后再进行服务器端改造。
