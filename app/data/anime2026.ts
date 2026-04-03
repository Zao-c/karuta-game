import { CharacterConfig, CharacterConfigMap } from '../types';

export type Anime2026Data = {
  lastUpdated: string;
  source: string;
  year: number;
  total: number;
  anime: AnimeCard[];
};

export type AnimeCard = {
  id: string;
  name: string;
  nameCn?: string;
  nameEn: string;
  anime: string;
  animeCn?: string;
  coverImage: string;
  coverImageMedium: string;
  color: string;
  description: string;
  genres: string[];
  score: number;
  popularity: number;
  episodes: number;
  season: string;
  startDate: {
    year: number;
    month: number;
    day: number;
  };
  siteUrl: string;
  quotes: string[];
};

const anime2026Data: AnimeCard[] = [
  {
    "id": "anime_172463",
    "name": "呪術廻戦 死滅回游 前編",
    "nameCn": "咒术回战 死灭回游篇",
    "nameEn": "JUJUTSU KAISEN Season 3",
    "anime": "呪術廻戦",
    "animeCn": "咒术回战",
    "coverImage": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx172463-LnXqHzt74SJL.jpg",
    "coverImageMedium": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/small/bx172463-LnXqHzt74SJL.jpg",
    "color": "#5093d6",
    "description": "咒术回战第三季，涉谷事变后的死灭回游篇",
    "genres": ["Action", "Drama", "Supernatural"],
    "score": 84,
    "popularity": 153736,
    "episodes": 12,
    "season": "WINTER",
    "startDate": { "year": 2026, "month": 1, "day": 9 },
    "siteUrl": "https://anilist.co/anime/172463",
    "quotes": ["领域展开！", "天上天下，唯我独尊！", "没事的，因为我是最强的"]
  },
  {
    "id": "anime_182255",
    "name": "葬送のフリーレン 第2期",
    "nameCn": "葬送的芙莉莲 第二季",
    "nameEn": "Frieren Season 2",
    "anime": "葬送のフリーレン",
    "animeCn": "葬送的芙莉莲",
    "coverImage": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx182255-butzrqd4I0aC.jpg",
    "coverImageMedium": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/small/bx182255-butzrqd4I0aC.jpg",
    "color": "#5dc9f1",
    "description": "葬送的芙莉莲第二季",
    "genres": ["Adventure", "Drama", "Fantasy"],
    "score": 89,
    "popularity": 136119,
    "episodes": 10,
    "season": "WINTER",
    "startDate": { "year": 2026, "month": 1, "day": 16 },
    "siteUrl": "https://anilist.co/anime/182255",
    "quotes": ["勇者辛美尔的话，一定会这么做的", "我想知道「我爱你」是什么意思", "人类的一生真的很短暂呢"]
  },
  {
    "id": "anime_166613",
    "name": "地獄楽 第二期",
    "nameCn": "地狱乐 第二季",
    "nameEn": "Hell's Paradise Season 2",
    "anime": "地獄楽",
    "animeCn": "地狱乐",
    "coverImage": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx166613-uHB8q3D4qbon.jpg",
    "coverImageMedium": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/small/bx166613-uHB8q3D4qbon.jpg",
    "color": "#e49328",
    "description": "地狱乐第二季",
    "genres": ["Action", "Adventure", "Supernatural"],
    "score": 80,
    "popularity": 108541,
    "episodes": 12,
    "season": "WINTER",
    "startDate": { "year": 2026, "month": 1, "day": 11 },
    "siteUrl": "https://anilist.co/anime/166613",
    "quotes": ["这个世界上没有比这更美好的了", "我会保护你的", "这就是我的道"]
  },
  {
    "id": "anime_217821",
    "name": "【推しの子】第3期",
    "nameEn": "OSHI NO KO Season 3",
    "anime": "【推しの子】",
    "coverImage": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx217821-4s5zH1GdLX0I.jpg",
    "coverImageMedium": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/small/bx217821-4s5zH1GdLX0I.jpg",
    "color": "#f15e6b",
    "description": "我推的孩子第三季",
    "genres": ["Drama", "Mystery", "Supernatural"],
    "score": 85,
    "popularity": 95000,
    "episodes": 12,
    "season": "SPRING",
    "startDate": { "year": 2026, "month": 4, "day": 1 },
    "siteUrl": "https://anilist.co/anime/217821",
    "quotes": ["谎言也是爱的一种形式", "我会成为顶级偶像的", "在演艺圈，真相往往被掩盖"]
  },
  {
    "id": "anime_214273",
    "name": "炎炎ノ消防隊 参ノ章 第2クール",
    "nameEn": "Fire Force Season 3 Part 2",
    "anime": "炎炎ノ消防隊",
    "coverImage": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx214273.jpg",
    "coverImageMedium": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/small/bx214273.jpg",
    "color": "#f45042",
    "description": "炎炎消防队第三章第二季",
    "genres": ["Action", "Supernatural"],
    "score": 78,
    "popularity": 85000,
    "episodes": 12,
    "season": "WINTER",
    "startDate": { "year": 2026, "month": 1, "day": 1 },
    "siteUrl": "https://anilist.co/anime/214273",
    "quotes": ["我要成为英雄！", "火焰是我的力量", "守护这个城市！"]
  },
  {
    "id": "anime_209415",
    "name": "Fate/strange Fake",
    "nameEn": "Fate/strange Fake",
    "anime": "Fate/strange Fake",
    "coverImage": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx209415.jpg",
    "coverImageMedium": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/small/bx209415.jpg",
    "color": "#6b5ce7",
    "description": "Fate系列新作",
    "genres": ["Action", "Fantasy", "Supernatural"],
    "score": 82,
    "popularity": 80000,
    "episodes": 12,
    "season": "WINTER",
    "startDate": { "year": 2026, "month": 1, "day": 1 },
    "siteUrl": "https://anilist.co/anime/209415",
    "quotes": ["Servant，召唤！", "圣杯战争开始了", "你是我的Master吗？"]
  },
  {
    "id": "anime_215323",
    "name": "無職転生Ⅲ",
    "nameEn": "Mushoku Tensei Season 3",
    "anime": "無職転生",
    "coverImage": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx215323.jpg",
    "coverImageMedium": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/small/bx215323.jpg",
    "color": "#4a90d9",
    "description": "无职转生第三季",
    "genres": ["Adventure", "Drama", "Fantasy"],
    "score": 86,
    "popularity": 75000,
    "episodes": 12,
    "season": "SPRING",
    "startDate": { "year": 2026, "month": 4, "day": 1 },
    "siteUrl": "https://anilist.co/anime/215323",
    "quotes": ["这一次，我一定要认真地活下去", "我会保护家人的", "从零开始的人生"]
  },
  {
    "id": "anime_216678",
    "name": "とんがり帽子のアトリエ",
    "nameEn": "Witch Hat Atelier",
    "anime": "とんがり帽子のアトリエ",
    "coverImage": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx216678.jpg",
    "coverImageMedium": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/small/bx216678.jpg",
    "color": "#9b59b6",
    "description": "尖帽子的魔法工坊",
    "genres": ["Fantasy", "Adventure"],
    "score": 83,
    "popularity": 70000,
    "episodes": 12,
    "season": "SPRING",
    "startDate": { "year": 2026, "month": 4, "day": 1 },
    "siteUrl": "https://anilist.co/anime/216678",
    "quotes": ["我想成为魔女！", "魔法是给予人们梦想的东西", "这个咒语，我会学会的"]
  },
  {
    "id": "anime_214532",
    "name": "Re:ゼロから始める異世界生活 4th season",
    "nameEn": "Re:Zero Season 4",
    "anime": "Re:ゼロから始める異世界生活",
    "coverImage": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx214532.jpg",
    "coverImageMedium": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/small/bx214532.jpg",
    "color": "#3498db",
    "description": "Re:从零开始的异世界生活第四季",
    "genres": ["Adventure", "Drama", "Fantasy"],
    "score": 87,
    "popularity": 68000,
    "episodes": 12,
    "season": "SUMMER",
    "startDate": { "year": 2026, "month": 7, "day": 1 },
    "siteUrl": "https://anilist.co/anime/214532",
    "quotes": ["从零开始！", "死亡回归", "我会拯救大家的"]
  },
  {
    "id": "anime_213456",
    "name": "転生したらスライムだった件 第4期",
    "nameEn": "That Time I Got Reincarnated as a Slime Season 4",
    "anime": "転生したらスライムだった件",
    "coverImage": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx213456.jpg",
    "coverImageMedium": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/small/bx213456.jpg",
    "color": "#2ecc71",
    "description": "关于我转生变成史莱姆这档事第四季",
    "genres": ["Adventure", "Comedy", "Fantasy"],
    "score": 81,
    "popularity": 65000,
    "episodes": 24,
    "season": "FALL",
    "startDate": { "year": 2026, "month": 10, "day": 1 },
    "siteUrl": "https://anilist.co/anime/213456",
    "quotes": ["我是利姆路！", "建立一个魔物和人类共存的国家", "大家，一起来吧！"]
  },
  {
    "id": "anime_217654",
    "name": "ようこそ実力至上主義の教室へ 4th Season",
    "nameEn": "Classroom of the Elite Season 4",
    "anime": "ようこそ実力至上主義の教室へ",
    "coverImage": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx217654.jpg",
    "coverImageMedium": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/small/bx217654.jpg",
    "color": "#e74c3c",
    "description": "欢迎来到实力至上主义的教室第四季",
    "genres": ["Drama", "Psychological"],
    "score": 80,
    "popularity": 62000,
    "episodes": 12,
    "season": "SPRING",
    "startDate": { "year": 2026, "month": 4, "day": 1 },
    "siteUrl": "https://anilist.co/anime/217654",
    "quotes": ["我是绫小路清隆", "这所学校是实力至上主义", "我会赢的"]
  },
  {
    "id": "anime_218901",
    "name": "BLEACH 千年血戦篇-禍進譚-",
    "nameEn": "BLEACH: Thousand-Year Blood War Part 4",
    "anime": "BLEACH",
    "coverImage": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx218901.jpg",
    "coverImageMedium": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/small/bx218901.jpg",
    "color": "#f39c12",
    "description": "死神千年血战篇最终章",
    "genres": ["Action", "Adventure", "Supernatural"],
    "score": 88,
    "popularity": 60000,
    "episodes": 12,
    "season": "WINTER",
    "startDate": { "year": 2026, "month": 1, "day": 1 },
    "siteUrl": "https://anilist.co/anime/218901",
    "quotes": ["卍解！", "我是黑崎一护", "我会保护所有人的！"]
  },
  {
    "id": "anime_219234",
    "name": "薬屋のひとりごと 第3期",
    "nameEn": "The Apothecary Diaries Season 3",
    "anime": "薬屋のひとりごと",
    "coverImage": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx219234.jpg",
    "coverImageMedium": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/small/bx219234.jpg",
    "color": "#1abc9c",
    "description": "药屋少女的呢喃第三季",
    "genres": ["Drama", "Mystery", "Romance"],
    "score": 84,
    "popularity": 58000,
    "episodes": 12,
    "season": "SPRING",
    "startDate": { "year": 2026, "month": 4, "day": 1 },
    "siteUrl": "https://anilist.co/anime/219234",
    "quotes": ["我只是个普通的药娘", "这个谜题，我会解开的", "后宫的阴谋"]
  },
  {
    "id": "anime_220123",
    "name": "Dr.STONE SCIENCE FUTURE",
    "nameEn": "Dr. Stone Season 4",
    "anime": "Dr.STONE",
    "coverImage": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx220123.jpg",
    "coverImageMedium": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/small/bx220123.jpg",
    "color": "#27ae60",
    "description": "新石纪第四季",
    "genres": ["Adventure", "Sci-Fi"],
    "score": 83,
    "popularity": 55000,
    "episodes": 12,
    "season": "WINTER",
    "startDate": { "year": 2026, "month": 1, "day": 1 },
    "siteUrl": "https://anilist.co/anime/220123",
    "quotes": ["科学是最强的！", "我要复活全人类！", "这是科学的胜利！"]
  },
  {
    "id": "anime_221456",
    "name": "お隣の天使様にいつの間にか駄目人間にされていた件 第2期",
    "nameEn": "The Angel Next Door Season 2",
    "anime": "お隣の天使様",
    "coverImage": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx221456.jpg",
    "coverImageMedium": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/small/bx221456.jpg",
    "color": "#e91e63",
    "description": "关于邻家的天使大人不知不觉把我惯成了废人这档事第二季",
    "genres": ["Romance", "Comedy"],
    "score": 79,
    "popularity": 52000,
    "episodes": 12,
    "season": "SPRING",
    "startDate": { "year": 2026, "month": 4, "day": 1 },
    "siteUrl": "https://anilist.co/anime/221456",
    "quotes": ["真昼小姐...", "我会照顾你的", "邻家的天使大人"]
  },
  {
    "id": "anime_222789",
    "name": "魔都精兵のスレイブ2",
    "nameEn": "Chained Soldier Season 2",
    "anime": "魔都精兵のスレイブ",
    "coverImage": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx222789.jpg",
    "coverImageMedium": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/small/bx222789.jpg",
    "color": "#9c27b0",
    "description": "魔都精兵的奴隶第二季",
    "genres": ["Action", "Fantasy", "Romance"],
    "score": 75,
    "popularity": 50000,
    "episodes": 12,
    "season": "SUMMER",
    "startDate": { "year": 2026, "month": 7, "day": 1 },
    "siteUrl": "https://anilist.co/anime/222789",
    "quotes": ["我是你的奴隶！", "魔都的战斗", "我会保护美人的！"]
  },
  {
    "id": "anime_223012",
    "name": "杖と剣のウィストリア Season2",
    "nameEn": "Wistoria: Wand and Sword Season 2",
    "anime": "杖と剣のウィストリア",
    "coverImage": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx223012.jpg",
    "coverImageMedium": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/small/bx223012.jpg",
    "color": "#673ab7",
    "description": "杖与剑的威斯利亚第二季",
    "genres": ["Action", "Adventure", "Fantasy"],
    "score": 77,
    "popularity": 48000,
    "episodes": 12,
    "season": "FALL",
    "startDate": { "year": 2026, "month": 10, "day": 1 },
    "siteUrl": "https://anilist.co/anime/223012",
    "quotes": ["我要成为大魔法师！", "剑与杖的力量", "威斯利亚的传说"]
  },
  {
    "id": "anime_224345",
    "name": "勇者パーティーにかわいい子がいたので、告白してみた",
    "nameEn": "There was a Cute Girl in the Hero's Party",
    "anime": "勇者パーティーにかわいい子がいたので",
    "coverImage": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx224345.jpg",
    "coverImageMedium": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/small/bx224345.jpg",
    "color": "#ff5722",
    "description": "勇者队伍里有个可爱的女孩子所以我告白了",
    "genres": ["Romance", "Comedy", "Fantasy"],
    "score": 76,
    "popularity": 45000,
    "episodes": 12,
    "season": "SPRING",
    "startDate": { "year": 2026, "month": 4, "day": 1 },
    "siteUrl": "https://anilist.co/anime/224345",
    "quotes": ["我喜欢你！", "勇者队伍的日常", "这是我的告白！"]
  },
  {
    "id": "anime_225678",
    "name": "TRIGUN STARGAZE",
    "nameEn": "Trigun Stargaze",
    "anime": "TRIGUN",
    "coverImage": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx225678.jpg",
    "coverImageMedium": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/small/bx225678.jpg",
    "color": "#ff9800",
    "description": "枪神Trigun新作",
    "genres": ["Action", "Sci-Fi", "Adventure"],
    "score": 81,
    "popularity": 42000,
    "episodes": 12,
    "season": "WINTER",
    "startDate": { "year": 2026, "month": 1, "day": 1 },
    "siteUrl": "https://anilist.co/anime/225678",
    "quotes": ["Love and Peace!", "这个世界上没有人有权夺取他人的生命", "我是Vash the Stampede"]
  },
  {
    "id": "anime_226901",
    "name": "真夜中ハートチューン",
    "nameEn": "Tune In to the Midnight Heart",
    "anime": "真夜中ハートチューン",
    "coverImage": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx226901.jpg",
    "coverImageMedium": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/small/bx226901.jpg",
    "color": "#00bcd4",
    "description": "午夜心跳调频",
    "genres": ["Romance", "Drama"],
    "score": 74,
    "popularity": 40000,
    "episodes": 12,
    "season": "SPRING",
    "startDate": { "year": 2026, "month": 4, "day": 1 },
    "siteUrl": "https://anilist.co/anime/226901",
    "quotes": ["午夜的广播开始了", "你的心声，我听到了", "这是属于我们的频率"]
  },
  {
    "id": "anime_227234",
    "name": "アオのハコ Season2",
    "nameEn": "Blue Box Season 2",
    "anime": "アオのハコ",
    "coverImage": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx227234.jpg",
    "coverImageMedium": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/small/bx227234.jpg",
    "color": "#03a9f4",
    "description": "蓝色监狱第二季",
    "genres": ["Romance", "Sports", "Drama"],
    "score": 80,
    "popularity": 38000,
    "episodes": 12,
    "season": "FALL",
    "startDate": { "year": 2026, "month": 10, "day": 1 },
    "siteUrl": "https://anilist.co/anime/227234",
    "quotes": ["我会成为最强的！", "青春的篮球梦", "蓝色箱子的秘密"]
  },
  {
    "id": "anime_228567",
    "name": "ヘルモード",
    "nameEn": "HELL MODE",
    "anime": "ヘルモード",
    "coverImage": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx228567.jpg",
    "coverImageMedium": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/small/bx228567.jpg",
    "color": "#f44336",
    "description": "地狱模式～硬核玩家在异世界无双～",
    "genres": ["Action", "Adventure", "Fantasy"],
    "score": 73,
    "popularity": 35000,
    "episodes": 12,
    "season": "SUMMER",
    "startDate": { "year": 2026, "month": 7, "day": 1 },
    "siteUrl": "https://anilist.co/anime/228567",
    "quotes": ["地狱模式启动！", "这就是硬核玩家的实力", "废设定的逆袭"]
  },
  {
    "id": "anime_229890",
    "name": "ダーウィン事変",
    "nameEn": "The Darwin Incident",
    "anime": "ダーウィン事変",
    "coverImage": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx229890.jpg",
    "coverImageMedium": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/small/bx229890.jpg",
    "color": "#795548",
    "description": "达尔文事变",
    "genres": ["Drama", "Mystery", "Sci-Fi"],
    "score": 78,
    "popularity": 32000,
    "episodes": 12,
    "season": "WINTER",
    "startDate": { "year": 2026, "month": 1, "day": 1 },
    "siteUrl": "https://anilist.co/anime/229890",
    "quotes": ["进化的终点是什么？", "人类与猿的边界", "达尔文的遗产"]
  },
  {
    "id": "anime_230123",
    "name": "黄泉のツガイ",
    "nameEn": "Daemons of the Shadow Realm",
    "anime": "黄泉のツガイ",
    "coverImage": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx230123.jpg",
    "coverImageMedium": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/small/bx230123.jpg",
    "color": "#607d8b",
    "description": "黄泉的羁绊",
    "genres": ["Action", "Fantasy", "Supernatural"],
    "score": 76,
    "popularity": 30000,
    "episodes": 12,
    "season": "SPRING",
    "startDate": { "year": 2026, "month": 4, "day": 1 },
    "siteUrl": "https://anilist.co/anime/230123",
    "quotes": ["黄泉的使者", "生与死的边界", "这是我们的羁绊"]
  },
  {
    "id": "anime_231456",
    "name": "違国日記",
    "nameEn": "Journal with Witch",
    "anime": "違国日記",
    "coverImage": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx231456.jpg",
    "coverImageMedium": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/small/bx231456.jpg",
    "color": "#8bc34a",
    "description": "异国日记",
    "genres": ["Adventure", "Fantasy", "Slice of Life"],
    "score": 75,
    "popularity": 28000,
    "episodes": 12,
    "season": "SUMMER",
    "startDate": { "year": 2026, "month": 7, "day": 1 },
    "siteUrl": "https://anilist.co/anime/231456",
    "quotes": ["异国的旅途", "魔女的日记", "这是我的冒险记录"]
  },
  {
    "id": "anime_232789",
    "name": "うるわしの宵の月",
    "nameEn": "In the Clear Moonlit Dusk",
    "anime": "うるわしの宵の月",
    "coverImage": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx232789.jpg",
    "coverImageMedium": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/small/bx232789.jpg",
    "color": "#ffc107",
    "description": "美丽的宵月",
    "genres": ["Romance", "Drama"],
    "score": 77,
    "popularity": 26000,
    "episodes": 12,
    "season": "FALL",
    "startDate": { "year": 2026, "month": 10, "day": 1 },
    "siteUrl": "https://anilist.co/anime/232789",
    "quotes": ["月色真美", "宵之月的约定", "这是我们的故事"]
  },
  {
    "id": "anime_234012",
    "name": "勇者刑に処す　懲罰勇者9004隊刑務記録",
    "nameEn": "Sentenced to Be a Hero",
    "anime": "勇者刑に処す",
    "coverImage": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx234012.jpg",
    "coverImageMedium": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/small/bx234012.jpg",
    "color": "#ff7043",
    "description": "勇者刑～惩罚勇者9004队刑务记录～",
    "genres": ["Action", "Comedy", "Fantasy"],
    "score": 74,
    "popularity": 24000,
    "episodes": 12,
    "season": "WINTER",
    "startDate": { "year": 2026, "month": 1, "day": 1 },
    "siteUrl": "https://anilist.co/anime/234012",
    "quotes": ["我是惩罚勇者！", "9004队的日常", "勇者的刑务记录"]
  },
  {
    "id": "anime_235345",
    "name": "正反対な君と僕",
    "nameEn": "You and I Are Polar Opposites",
    "anime": "正反対な君と僕",
    "coverImage": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx235345.jpg",
    "coverImageMedium": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/small/bx235345.jpg",
    "color": "#26c6da",
    "description": "正相反的你与我",
    "genres": ["Romance", "Comedy", "School"],
    "score": 78,
    "popularity": 22000,
    "episodes": 12,
    "season": "SPRING",
    "startDate": { "year": 2026, "month": 4, "day": 1 },
    "siteUrl": "https://anilist.co/anime/235345",
    "quotes": ["我们是正相反的", "但是我喜欢你", "正相反的恋爱"]
  },
  {
    "id": "anime_236678",
    "name": "死亡遊戯で飯を食う。",
    "nameEn": "SHIBOYUGI",
    "anime": "死亡遊戯で飯を食う。",
    "coverImage": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx236678.jpg",
    "coverImageMedium": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/small/bx236678.jpg",
    "color": "#5c6bc0",
    "description": "靠死亡游戏吃饭",
    "genres": ["Action", "Mystery", "Thriller"],
    "score": 76,
    "popularity": 20000,
    "episodes": 12,
    "season": "SUMMER",
    "startDate": { "year": 2026, "month": 7, "day": 1 },
    "siteUrl": "https://anilist.co/anime/236678",
    "quotes": ["死亡游戏开始！", "赌上性命的饭", "这是生存游戏"]
  }
];

export function getAnimeData(): AnimeCard[] {
  return anime2026Data;
}

export function getAnimeConfigMap(): CharacterConfigMap {
  const map = new Map<string, CharacterConfig>();
  anime2026Data.forEach(anime => {
    map.set(anime.id, convertToCharacterConfig(anime));
  });
  return map;
}

export function getAnimeById(id: string): AnimeCard | undefined {
  return anime2026Data.find(anime => anime.id === id);
}

export function getRandomAnimeQuote(anime: AnimeCard): string {
  const index = Math.floor(Math.random() * anime.quotes.length);
  return anime.quotes[index];
}

export function convertToCharacterConfig(anime: AnimeCard): CharacterConfig {
  return {
    id: anime.id,
    name: anime.nameCn || anime.name,
    anime: anime.animeCn || anime.anime,
    emoji: getEmojiForGenre(anime.genres[0]),
    card: [`${anime.id}-1`],
    quotes: anime.quotes,
    color: anime.color,
    coverImage: anime.coverImage,
    coverImageMedium: anime.coverImageMedium,
    description: anime.description,
    score: anime.score,
    popularity: anime.popularity
  };
}

function getEmojiForGenre(genre: string): string {
  const genreEmojiMap: Record<string, string> = {
    'Action': '⚔️',
    'Adventure': '🗺️',
    'Comedy': '😂',
    'Drama': '🎭',
    'Fantasy': '✨',
    'Horror': '👻',
    'Mystery': '🔍',
    'Psychological': '🧠',
    'Romance': '💕',
    'Sci-Fi': '🚀',
    'Slice of Life': '🌸',
    'Sports': '⚽',
    'Supernatural': '🌟',
    'Thriller': '😱'
  };
  return genreEmojiMap[genre] || '🎬';
}

export function getCharacterDataFromAnime(): CharacterConfig[] {
  return anime2026Data.map(convertToCharacterConfig);
}

export { shuffleArray } from './characters';
