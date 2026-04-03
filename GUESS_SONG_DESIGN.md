# 猜歌模式设计文档

## 功能概述

猜歌模式是一种新的游戏模式，玩家通过听歌曲片段来猜测对应的动漫/角色。

---

## 核心功能

### 1. 歌曲库管理

#### 数据结构
```typescript
type Song = {
  id: string;                    // 歌曲唯一ID
  title: string;                 // 歌曲名称
  artist: string;                // 艺术家/歌手
  anime: string;                 // 所属动画
  audioFile: string;             // 音频文件路径/URL
  coverImage?: string;           // 封面图片
  duration: number;              // 总时长（秒）
  sampleStart: number;           // 试听开始时间（秒）
  sampleDuration: number;        // 试听时长（秒）
  difficulty: 'easy' | 'medium' | 'hard';  // 难度
  tags: string[];                // 标签（OP/ED/OST等）
  linkedCardId?: string;         // 关联的歌牌ID
}

type SongLibrary = {
  id: string;
  name: string;
  description: string;
  songs: Song[];
  createdAt: number;
  updatedAt: number;
}
```

#### 歌曲库JSON格式
```json
{
  "name": "我的动漫歌曲库",
  "description": "精选动漫歌曲",
  "songs": [
    {
      "id": "song_001",
      "title": "勇者",
      "artist": "YOASOBI",
      "anime": "葬送的芙莉莲",
      "audioFile": "songs/yusha.mp3",
      "coverImage": "https://example.com/frieren.jpg",
      "duration": 240,
      "sampleStart": 30,
      "sampleDuration": 15,
      "difficulty": "medium",
      "tags": ["OP"],
      "linkedCardId": "card_frieren"
    }
  ]
}
```

---

### 2. 音频播放器

#### 功能需求
- 支持本地音频文件上传
- 支持在线音频URL
- 随机播放片段
- 音量控制
- 播放进度显示
- 暂停/继续功能

#### 技术实现
```typescript
class AudioPlayer {
  private audio: HTMLAudioElement;
  private currentSong: Song | null = null;
  
  loadSong(song: Song): void;
  playSample(): void;
  pause(): void;
  resume(): void;
  setVolume(volume: number): void;
  getCurrentTime(): number;
  getDuration(): number;
}
```

---

### 3. 猜歌游戏模式

#### 游戏流程
```
1. 选择歌曲库
2. 设置游戏参数（难度、轮数、试听时长）
3. 开始游戏
   ├── 播放歌曲片段
   ├── 玩家猜测
   ├── 显示答案
   └── 计分
4. 结算界面
```

#### 游戏参数
```typescript
type GuessSongConfig = {
  libraryId: string;             // 歌曲库ID
  rounds: number;                // 游戏轮数
  sampleDuration: number;        // 试听时长（秒）
  difficulty: 'all' | 'easy' | 'medium' | 'hard';
  showOptions: boolean;          // 是否显示选项
  optionCount: number;           // 选项数量
  timeLimit: number;             // 答题时间限制（秒）
  playFullSong: boolean;         // 答对后播放完整歌曲
}
```

---

## 实现方案

### 方案一：本地音频文件（推荐用于开发测试）

#### 优点
- 不依赖网络
- 加载速度快
- 完全控制音频质量

#### 缺点
- 文件存储占用空间
- 无法跨设备共享
- 上传文件大小限制

#### 实现步骤
1. 用户上传音频文件到浏览器
2. 使用 File API 读取文件
3. 创建 Blob URL 播放
4. 歌曲库配置存储在 localStorage

---

### 方案二：在线音频URL（推荐用于生产环境）

#### 优点
- 不占用本地存储
- 可以跨设备共享
- 支持流媒体

#### 缺点
- 依赖网络
- 需要音频托管服务
- 可能有版权问题

#### 实现步骤
1. 音频文件托管在 CDN 或对象存储
2. 歌曲库配置存储在数据库
3. 通过 URL 播放音频

---

### 方案三：混合方案

- 支持本地文件上传（开发/测试）
- 支持在线URL（生产环境）
- 用户可选择使用哪种方式

---

## 界面设计

### 歌曲库管理界面
```
┌─────────────────────────────────────────┐
│  🎵 歌曲库管理                           │
├─────────────────────────────────────────┤
│  [+ 导入歌曲库]  [+ 创建歌曲库]          │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 📀 我的动漫歌曲库 (50首)         │   │
│  │    OP: 20 | ED: 15 | OST: 15    │   │
│  │    [编辑] [导出] [删除]          │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 📀 2024新番歌曲库 (30首)         │   │
│  │    OP: 15 | ED: 10 | OST: 5     │   │
│  │    [编辑] [导出] [删除]          │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### 歌曲编辑界面
```
┌─────────────────────────────────────────┐
│  编辑歌曲                               │
├─────────────────────────────────────────┤
│  歌曲名称: [勇者________________]       │
│  歌手:     [YOASOBI_____________]       │
│  动画:     [葬送的芙莉莲_______]        │
│                                         │
│  音频文件:                              │
│  [选择文件] yusha.mp3 (3.5MB)           │
│                                         │
│  试听设置:                              │
│  开始时间: [30] 秒                      │
│  试听时长: [15] 秒                      │
│                                         │
│  难度: ○ 简单 ● 中等 ○ 困难            │
│  标签: ☑OP ☐ED ☐OST                    │
│                                         │
│  关联歌牌: [芙莉莲 ▼]                   │
│                                         │
│  [预览] [保存] [取消]                   │
└─────────────────────────────────────────┘
```

### 猜歌游戏界面
```
┌─────────────────────────────────────────┐
│  🎵 猜歌模式 - 第 3/10 轮               │
├─────────────────────────────────────────┤
│                                         │
│        ▶️ 正在播放... 00:08 / 00:15     │
│        ████████░░░░░░░░░░░░ 53%         │
│        🔊 ████████████░░ 80%            │
│                                         │
│  剩余时间: 00:25                        │
│                                         │
│  请选择答案:                            │
│  ┌─────────────────────────────────┐   │
│  │ A. 葬送的芙莉莲 - 勇者           │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ B. 鬼灭之刃 - 紅蓮華             │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ C. 进击的巨人 - 紅蓮の弓矢       │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ D. 咒术回战 - 廻廻奇譚           │   │
│  └─────────────────────────────────┘   │
│                                         │
│  分数: 150分  |  连击: 2               │
└─────────────────────────────────────────┘
```

### 答案揭晓界面
```
┌─────────────────────────────────────────┐
│  ✅ 正确！                              │
├─────────────────────────────────────────┤
│                                         │
│  🎵 勇者 - YOASOBI                      │
│  📺 葬送的芙莉莲                        │
│                                         │
│  [▶️ 播放完整歌曲]                      │
│                                         │
│  你的答案: A. 葬送的芙莉莲 - 勇者       │
│  反应时间: 3.2秒                        │
│  获得分数: +50分                        │
│                                         │
│  [下一题]                               │
└─────────────────────────────────────────┘
```

---

## 技术实现

### 1. 歌曲库服务

```typescript
// lib/songLibraryService.ts

const SONG_LIBRARY_KEY = 'karuta_song_libraries';

type Song = {
  id: string;
  title: string;
  artist: string;
  anime: string;
  audioFile?: string;        // 本地文件 Blob URL
  audioUrl?: string;         // 在线URL
  coverImage?: string;
  duration: number;
  sampleStart: number;
  sampleDuration: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  linkedCardId?: string;
}

type SongLibrary = {
  id: string;
  name: string;
  description: string;
  songs: Song[];
  createdAt: number;
  updatedAt: number;
}

class SongLibraryService {
  getLibraries(): SongLibrary[];
  getLibrary(id: string): SongLibrary | null;
  saveLibrary(library: Omit<SongLibrary, 'id' | 'createdAt' | 'updatedAt'>): SongLibrary;
  updateLibrary(id: string, updates: Partial<SongLibrary>): SongLibrary | null;
  deleteLibrary(id: string): void;
  
  addSong(libraryId: string, song: Omit<Song, 'id'>): Song;
  updateSong(libraryId: string, songId: string, updates: Partial<Song>): Song | null;
  deleteSong(libraryId: string, songId: string): void;
  
  importLibrary(jsonData: string): SongLibrary;
  exportLibrary(id: string): string;
}
```

### 2. 音频播放器组件

```tsx
// components/AudioPlayer.tsx

interface AudioPlayerProps {
  song: Song;
  autoPlay?: boolean;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
}

export default function AudioPlayer({ song, autoPlay, onEnded, onTimeUpdate }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  
  const playSample = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = song.sampleStart;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };
  
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      
      // 到达试听结束时间
      if (audioRef.current.currentTime >= song.sampleStart + song.sampleDuration) {
        audioRef.current.pause();
        setIsPlaying(false);
        onEnded?.();
      }
    }
  };
  
  return (
    <Box>
      <audio
        ref={audioRef}
        src={song.audioFile || song.audioUrl}
        onTimeUpdate={handleTimeUpdate}
      />
      <IconButton onClick={playSample}>
        {isPlaying ? <Pause /> : <PlayArrow />}
      </IconButton>
      <Slider
        value={currentTime}
        min={song.sampleStart}
        max={song.sampleStart + song.sampleDuration}
      />
    </Box>
  );
}
```

### 3. 猜歌游戏模式

```tsx
// app/page.tsx (新增游戏模式)

type GameMode = 
  | 'AutoRandom'      // 现有模式：随机台词
  | 'JudgeMode'       // 现有模式：裁判模式
  | 'GuessSong';      // 新模式：猜歌模式

const GuessSongGame = ({ library, config }: GuessSongGameProps) => {
  const [currentRound, setCurrentRound] = useState(0);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [options, setOptions] = useState<Song[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  
  const startRound = () => {
    // 随机选择歌曲
    const randomSong = selectRandomSong(library.songs, config.difficulty);
    setCurrentSong(randomSong);
    
    // 生成选项
    const songOptions = generateOptions(randomSong, library.songs, config.optionCount);
    setOptions(songOptions);
    
    setSelectedAnswer(null);
    setShowResult(false);
  };
  
  const handleAnswer = (songId: string) => {
    setSelectedAnswer(songId);
    setShowResult(true);
    
    if (songId === currentSong?.id) {
      // 正确答案
      const points = calculatePoints(config.difficulty, reactionTime);
      setScore(prev => prev + points);
    }
  };
  
  return (
    <Box>
      {/* 游戏界面 */}
    </Box>
  );
};
```

---

## 文件结构

```
karuta-game-v2/
├── lib/
│   ├── songLibraryService.ts    # 歌曲库服务
│   └── audioPlayer.ts           # 音频播放器工具
├── components/
│   ├── AudioPlayer.tsx          # 音频播放器组件
│   ├── SongLibraryManager.tsx   # 歌曲库管理组件
│   └── GuessSongGame.tsx        # 猜歌游戏组件
├── app/
│   ├── songs/
│   │   └── page.tsx             # 歌曲库管理页面
│   └── page.tsx                 # 主页面（添加猜歌模式）
└── public/
    └── songs/                   # 本地音频文件存储（可选）
```

---

## 实现优先级

### 第一阶段：基础功能
1. [ ] 创建歌曲库服务
2. [ ] 实现音频播放器组件
3. [ ] 歌曲库导入/导出功能
4. [ ] 基础猜歌游戏流程

### 第二阶段：完善功能
1. [ ] 歌曲编辑界面
2. [ ] 多种难度支持
3. [ ] 计分系统
4. [ ] 排行榜

### 第三阶段：高级功能
1. [ ] 音频波形可视化
2. [ ] 歌词同步显示
3. [ ] 多人猜歌对战
4. [ ] 自定义游戏规则

---

## 注意事项

### 版权问题
- 使用本地音频文件需确保拥有版权或使用权
- 在线音频URL需确保来源合法
- 建议添加版权声明和使用条款

### 性能优化
- 音频文件预加载
- 使用 Web Audio API 提高性能
- 大文件使用流式加载

### 用户体验
- 提供音量控制
- 显示加载进度
- 支持键盘快捷键
- 移动端适配

---

## 示例歌曲库配置

```json
{
  "name": "经典动漫歌曲库",
  "description": "精选经典动漫OP/ED",
  "songs": [
    {
      "id": "song_001",
      "title": "Butter-Fly",
      "artist": "和田光司",
      "anime": "数码宝贝大冒险",
      "audioUrl": "https://example.com/songs/butter-fly.mp3",
      "duration": 240,
      "sampleStart": 0,
      "sampleDuration": 15,
      "difficulty": "easy",
      "tags": ["OP"],
      "linkedCardId": "card_agumon"
    },
    {
      "id": "song_002",
      "title": "紅蓮華",
      "artist": "LiSA",
      "anime": "鬼灭之刃",
      "audioUrl": "https://example.com/songs/gurenge.mp3",
      "duration": 250,
      "sampleStart": 30,
      "sampleDuration": 15,
      "difficulty": "medium",
      "tags": ["OP"],
      "linkedCardId": "card_tanjiro"
    }
  ]
}
```
