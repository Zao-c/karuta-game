import { CharacterConfig, CharacterConfigMap, CharacterId } from '../types';

export const characterData: CharacterConfig[] = [
  {
    id: "naruto",
    name: "漩涡鸣人",
    anime: "火影忍者",
    emoji: "🦊",
    card: ["naruto-1", "naruto-2"],
    quotes: [
      "我绝对不会放弃！因为这就是我的忍道！",
      "我要成为火影！让全村人都认可我！",
      "有话直说就是我的忍道！"
    ],
    color: "#ff6b35"
  },
  {
    id: "sasuke",
    name: "宇智波佐助",
    anime: "火影忍者",
    emoji: "⚡",
    card: ["sasuke-1"],
    quotes: [
      "我一定要杀死那个男人……一定要复仇！",
      "我走在黑暗中，只为寻找光明。",
      "孤独……是成为强者的代价。"
    ],
    color: "#4a5568"
  },
  {
    id: "luffy",
    name: "蒙奇·D·路飞",
    anime: "海贼王",
    emoji: "🏴‍☠️",
    card: ["luffy-1", "luffy-2"],
    quotes: [
      "我是要成为海贼王的男人！",
      "我不是英雄，我只是一个想成为海贼王的人！",
      "因为我想做，所以我就去做！"
    ],
    color: "#e53e3e"
  },
  {
    id: "zoro",
    name: "罗罗诺亚·索隆",
    anime: "海贼王",
    emoji: "⚔️",
    card: ["zoro-1"],
    quotes: [
      "我发誓，我再也不会输了！",
      "背后的伤痕，是剑士的耻辱。",
      "我要成为世界第一大剑豪！"
    ],
    color: "#38a169"
  },
  {
    id: "goku",
    name: "孙悟空",
    anime: "龙珠",
    emoji: "🐵",
    card: ["goku-1"],
    quotes: [
      "我是孙悟空，我是赛亚人！",
      "我是为了打败你而生的！",
      "超级赛亚人……变身！"
    ],
    color: "#f6ad55"
  },
  {
    id: "conan",
    name: "江户川柯南",
    anime: "名侦探柯南",
    emoji: "🔍",
    card: ["conan-1"],
    quotes: [
      "真相只有一个！",
      "我叫江户川柯南，是个侦探。",
      "犯人就是你！"
    ],
    color: "#3182ce"
  },
  {
    id: "kaneki",
    name: "金木研",
    anime: "东京食尸鬼",
    emoji: "🎭",
    card: ["kaneki-1"],
    quotes: [
      "这世界上所有的悲剧，都源于当事人的能力不足。",
      "我是喰种……但我也是人类。",
      "错的不是我，是这个世界！"
    ],
    color: "#2d3748"
  },
  {
    id: "levi",
    name: "利威尔",
    anime: "进击的巨人",
    emoji: "🗡️",
    card: ["levi-1"],
    quotes: [
      "我会消灭所有巨人，一个不留！",
      "这是我自己选择的道路。",
      "不想死的话，就给我拼命活下去！"
    ],
    color: "#4a5568"
  },
  {
    id: "eren",
    name: "艾伦·耶格尔",
    anime: "进击的巨人",
    emoji: "👊",
    card: ["eren-1"],
    quotes: [
      "我要把它们……全部驱逐出去！",
      "我会一直前进，直到将敌人全部消灭！",
      "这是自由的代价。"
    ],
    color: "#553c9a"
  },
  {
    id: "gintoki",
    name: "坂田银时",
    anime: "银魂",
    emoji: "🍭",
    card: ["gintoki-1"],
    quotes: [
      "糖分是生命的源泉！",
      "我只是在守护我想守护的东西。",
      "武士之魂，永不熄灭！"
    ],
    color: "#c0c0c0"
  },
  {
    id: "ichigo",
    name: "黑崎一护",
    anime: "死神",
    emoji: "⚔️",
    card: ["ichigo-1"],
    quotes: [
      "我不是英雄，我只是个恰好能看见幽灵的高中生。",
      "我会保护所有人！",
      "卍解！"
    ],
    color: "#f6ad55"
  },
  {
    id: "tanjiro",
    name: "灶门炭治郎",
    anime: "鬼灭之刃",
    emoji: "🔥",
    card: ["tanjiro-1"],
    quotes: [
      "我会斩断悲伤的连锁！",
      "纵使吾身俱灭，定将恶鬼斩杀！",
      "不要放弃！呼吸！"
    ],
    color: "#2b6cb0"
  },
  {
    id: "rengoku",
    name: "炼狱杏寿郎",
    anime: "鬼灭之刃",
    emoji: "🔥",
    card: ["rengoku-1"],
    quotes: [
      "燃烧殆尽吧！",
      "我会履行我的职责！",
      "心无杂念，全力以赴！"
    ],
    color: "#c05621"
  },
  {
    id: "gojo",
    name: "五条悟",
    anime: "咒术回战",
    emoji: "👁️",
    card: ["gojo-1"],
    quotes: [
      "天上天下，唯我独尊。",
      "没事的，因为我是最强的。",
      "领域展开！"
    ],
    color: "#edf2f7"
  },
  {
    id: "saitama",
    name: "埼玉",
    anime: "一拳超人",
    emoji: "👊",
    card: ["saitama-1"],
    quotes: [
      "我只是一个兴趣使然的英雄。",
      "一拳就够了。",
      "我变秃了，也变强了。"
    ],
    color: "#f6e05e"
  },
  {
    id: "edward",
    name: "爱德华·艾尔利克",
    anime: "钢之炼金术师",
    emoji: "⚗️",
    card: ["edward-1"],
    quotes: [
      "等价交换是炼金术的基本原则！",
      "谁是小不点！我是爱德华·艾尔利克！",
      "人体炼成是禁忌！"
    ],
    color: "#d69e2e"
  },
  {
    id: "light",
    name: "夜神月",
    anime: "死亡笔记",
    emoji: "📓",
    card: ["light-1"],
    quotes: [
      "我是新世界的神！",
      "我要用死亡笔记净化这个世界！",
      "计划通。"
    ],
    color: "#1a202c"
  },
  {
    id: "l",
    name: "L",
    anime: "死亡笔记",
    emoji: "🍬",
    card: ["l-1"],
    quotes: [
      "我是L。",
      "正义必胜。",
      "你是凶手，夜神月。"
    ],
    color: "#2d3748"
  },
  {
    id: "doraemon",
    name: "哆啦A梦",
    anime: "哆啦A梦",
    emoji: "🔵",
    card: ["doraemon-1"],
    quotes: [
      "真是的，大雄又惹麻烦了！",
      "铜锣烧最好吃！",
      "任意门！"
    ],
    color: "#3182ce"
  },
  {
    id: "nobita",
    name: "野比大雄",
    anime: "哆啦A梦",
    emoji: "👓",
    card: ["nobita-1"],
    quotes: [
      "哆啦A梦！帮帮我！",
      "我一定会努力的！",
      "翻花绳我是天才！"
    ],
    color: "#f6e05e"
  },
  {
    id: "sakuragi",
    name: "樱木花道",
    anime: "灌篮高手",
    emoji: "🏀",
    card: ["sakuragi-1"],
    quotes: [
      "我是天才！",
      "因为我是天才樱木花道！",
      "安西教练，我想打篮球！"
    ],
    color: "#e53e3e"
  },
  {
    id: "rukawa",
    name: "流川枫",
    anime: "灌篮高手",
    emoji: "🌙",
    card: ["rukawa-1"],
    quotes: [
      "我要去美国。",
      "别打扰我睡觉。",
      "篮球是我的全部。"
    ],
    color: "#3182ce"
  },
  {
    id: "inuyasha",
    name: "犬夜叉",
    anime: "犬夜叉",
    emoji: "🐕",
    card: ["inuyasha-1"],
    quotes: [
      "给我坐下！",
      "我要成为真正的妖怪！",
      "铁碎牙，出鞘！"
    ],
    color: "#dd6b20"
  },
  {
    id: "sesshomaru",
    name: "杀生丸",
    anime: "犬夜叉",
    emoji: "🌙",
    card: ["sesshomaru-1"],
    quotes: [
      "区区人类……",
      "我杀生丸不需要任何人！",
      "这是属于我的道路。"
    ],
    color: "#c0c0c0"
  },
  {
    id: "astroboy",
    name: "阿童木",
    anime: "铁臂阿童木",
    emoji: "🤖",
    card: ["astroboy-1"],
    quotes: [
      "我是阿童木，我要保护人类！",
      "十万马力！",
      "正义必胜！"
    ],
    color: "#3182ce"
  },
  {
    id: "pikachu",
    name: "皮卡丘",
    anime: "宝可梦",
    emoji: "⚡",
    card: ["pikachu-1"],
    quotes: [
      "皮卡皮卡！",
      "皮卡丘！",
      "十万伏特！"
    ],
    color: "#f6e05e"
  },
  {
    id: "sailormoon",
    name: "月野兔",
    anime: "美少女战士",
    emoji: "🌙",
    card: ["sailormoon-1"],
    quotes: [
      "我要代表月亮消灭你！",
      "爱与正义的美少女战士！",
      "月棱镜威力，变身！"
    ],
    color: "#ed64a6"
  },
  {
    id: "spike",
    name: "斯派克·斯皮格尔",
    anime: "星际牛仔",
    emoji: "🚀",
    card: ["spike-1"],
    quotes: [
      "Bang.",
      "我只是个过客。",
      "See you space cowboy..."
    ],
    color: "#4a5568"
  },
  {
    id: "violet",
    name: "薇尔莉特·伊芙加登",
    anime: "紫罗兰永恒花园",
    emoji: "💜",
    card: ["violet-1"],
    quotes: [
      "我想知道「我爱你」是什么意思。",
      "只要客户有要求，我就会去任何地方。",
      "自动手记人偶，薇尔莉特·伊芙加登。"
    ],
    color: "#805ad5"
  },
  {
    id: "rem",
    name: "雷姆",
    anime: "Re:从零开始的异世界生活",
    emoji: "💙",
    card: ["rem-1"],
    quotes: [
      "如果是为了昴的话，雷姆什么都愿意做。",
      "从零开始！",
      "昴，我爱你。"
    ],
    color: "#3182ce"
  }
];

export function getCharacterConfigMap(): CharacterConfigMap {
  const map: CharacterConfigMap = new Map();
  characterData.forEach(char => {
    map.set(char.id, char);
  });
  return map;
}

export function getCharacterById(id: CharacterId): CharacterConfig | undefined {
  return characterData.find(char => char.id === id);
}

export function getRandomQuote(character: CharacterConfig): string {
  const index = Math.floor(Math.random() * character.quotes.length);
  return character.quotes[index];
}

export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
