const fs = require('fs');
const path = require('path');

const ANILIST_ENDPOINT = 'https://graphql.anilist.co';
const OUTPUT_FILE = path.join(__dirname, '..', 'public', 'data', 'anime_2026.json');
const TARGET_COUNT = 30;

const query = `
  query ($page: Int, $perPage: Int, $seasonYear: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        hasNextPage
        total
      }
      media(seasonYear: $seasonYear, format: TV, type: ANIME, sort: POPULARITY_DESC) {
        id
        title {
          romaji
          english
          native
        }
        coverImage {
          large
          medium
          color
        }
        description
        startDate {
          year
          month
          day
        }
        season
        episodes
        status
        siteUrl
        genres
        averageScore
        popularity
      }
    }
  }
`;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchAniList(year = 2026) {
  const allAnime = [];
  let page = 1;
  const perPage = 50;
  let hasNextPage = true;

  console.log(`开始获取 ${year} 年动画数据...`);

  while (hasNextPage) {
    try {
      console.log(`正在获取第 ${page} 页...`);
      
      const response = await fetch(ANILIST_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: {
            page,
            perPage,
            seasonYear: year
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP错误 ${response.status}: ${errorText}`);
        
        if (response.status === 429) {
          console.log('请求过于频繁，等待60秒后重试...');
          await sleep(60000);
          continue;
        }
        throw new Error(`HTTP错误: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.errors) {
        console.error('GraphQL错误:', result.errors);
        throw new Error('GraphQL查询错误');
      }

      const { media, pageInfo } = result.data.Page;
      allAnime.push(...media);
      hasNextPage = pageInfo.hasNextPage;
      
      console.log(`已获取 ${allAnime.length} 部动画，共 ${pageInfo.total} 部`);
      
      page++;
      await sleep(1000);
      
    } catch (error) {
      console.error(`获取第 ${page} 页时出错:`, error.message);
      console.log('等待5秒后重试...');
      await sleep(5000);
    }
  }

  return allAnime;
}

function generateMockData() {
  console.log('生成模拟数据作为备用...');
  
  const mockAnime = [];
  const animeNames = [
    { en: "Demon Slayer: Infinity Castle Arc", jp: "鬼滅の刃 無限城編", genre: "Action" },
    { en: "Jujutsu Kaisen Season 3", jp: "呪術廻戦 第3期", genre: "Action" },
    { en: "One Piece: Egghead Arc", jp: "ワンピース エッグヘッド編", genre: "Adventure" },
    { en: "Spy x Family Season 3", jp: "SPY×FAMILY 第3期", genre: "Comedy" },
    { en: "Chainsaw Man Season 2", jp: "チェンソーマン 第2期", genre: "Action" },
    { en: "My Hero Academia Season 8", jp: "僕のヒーローアカデミア 第8期", genre: "Action" },
    { en: "Attack on Titan: The Final Season", jp: "進撃の巨人 The Final Season", genre: "Action" },
    { en: "Solo Leveling Season 2", jp: "俺だけレベルアップな件 第2期", genre: "Action" },
    { en: "Frieren: Beyond Journey's End Season 2", jp: "葬送のフリーレン 第2期", genre: "Adventure" },
    { en: "Oshi no Ko Season 2", jp: "【推しの子】第2期", genre: "Drama" },
    { en: "Blue Lock Season 2", jp: "ブルーロック 第2期", genre: "Sports" },
    { en: "Vinland Saga Season 3", jp: "ヴィンランド・サガ 第3期", genre: "Action" },
    { en: "Dr. Stone Season 4", jp: "ドクターストーン 第4期", genre: "Adventure" },
    { en: "The Eminence in Shadow Season 3", jp: "陰の実力者になりたくて！第3期", genre: "Action" },
    { en: "Mushoku Tensei Season 3", jp: "無職転生 第3期", genre: "Adventure" },
    { en: "Re:Zero Season 4", jp: "Re:ゼロから始める異世界生活 第4期", genre: "Adventure" },
    { en: "Sword Art Online Progressive", jp: "ソードアート・オンライン プログレッシブ", genre: "Adventure" },
    { en: "Overlord Season 5", jp: "オーバーロード 第5期", genre: "Adventure" },
    { en: "That Time I Got Reincarnated as a Slime Season 4", jp: "転生したらスライムだった件 第4期", genre: "Adventure" },
    { en: "KonoSuba Season 3", jp: "この素晴らしい世界に祝福を！第3期", genre: "Comedy" },
    { en: "Shield Hero Season 4", jp: "盾の勇者の成り上がり 第4期", genre: "Adventure" },
    { en: "Classroom of the Elite Season 4", jp: "ようこそ実力至上主義の教室へ 第4期", genre: "Drama" },
    { en: "Tokyo Revengers Final Arc", jp: "東京リベンジャーズ 最終章", genre: "Action" },
    { en: "Haikyuu!! Movie: Final", jp: "ハイキュー!! FINAL", genre: "Sports" },
    { en: "Mob Psycho 100 Season 4", jp: "モブサイコ100 第4期", genre: "Action" },
    { en: "One Punch Man Season 3", jp: "ワンパンマン 第3期", genre: "Action" },
    { en: "Cyberpunk: Edgerunners Season 2", jp: "サイバーパンク エッジランナーズ 第2期", genre: "Sci-Fi" },
    { en: "Violet Evergarden: The Movie Sequel", jp: "ヴァイオレット・エヴァーガーデン 劇場版続編", genre: "Drama" },
    { en: "Made in Abyss Season 3", jp: "メイドインアビス 第3期", genre: "Adventure" },
    { en: "Steins;Gate 0 Elite", jp: "シュタインズ・ゲート ゼロ エリート", genre: "Sci-Fi" },
  ];

  const colors = ['#ff6b9d', '#c77dff', '#7b9fff', '#4ade80', '#f6ad55', '#f6e05e', '#ed64a6', '#38a169'];

  for (let i = 0; i < animeNames.length; i++) {
    const anime = animeNames[i];
    mockAnime.push({
      id: 100000 + i,
      title: {
        romaji: anime.en,
        english: anime.en,
        native: anime.jp
      },
      coverImage: {
        large: `https://picsum.photos/seed/anime${i}/400/600`,
        medium: `https://picsum.photos/seed/anime${i}/200/300`,
        color: colors[i % colors.length]
      },
      description: `${anime.en} - 2026年最新动画作品`,
      startDate: {
        year: 2026,
        month: (i % 12) + 1,
        day: (i % 28) + 1
      },
      season: ['WINTER', 'SPRING', 'SUMMER', 'FALL'][i % 4],
      episodes: 12 + (i % 13),
      status: 'RELEASING',
      siteUrl: `https://anilist.co/anime/${100000 + i}`,
      genres: [anime.genre, 'Animation'],
      averageScore: 70 + (i % 25),
      popularity: 50000 + i * 1000
    });
  }

  return mockAnime;
}

function selectTopAnime(animeList, count = 30) {
  const sorted = [...animeList].sort((a, b) => {
    if (b.popularity !== a.popularity) {
      return b.popularity - a.popularity;
    }
    return (b.averageScore || 0) - (a.averageScore || 0);
  });

  return sorted.slice(0, count);
}

function transformToCardData(animeList) {
  return animeList.map((anime, index) => ({
    id: `anime_${anime.id}`,
    name: anime.title.native || anime.title.romaji || anime.title.english,
    nameEn: anime.title.english || anime.title.romaji,
    anime: anime.title.native || anime.title.romaji,
    coverImage: anime.coverImage.large,
    coverImageMedium: anime.coverImage.medium,
    color: anime.coverImage.color || '#c77dff',
    description: anime.description?.replace(/<[^>]*>/g, '').slice(0, 100) || '',
    genres: anime.genres || [],
    score: anime.averageScore || 0,
    popularity: anime.popularity || 0,
    episodes: anime.episodes || 0,
    season: anime.season || 'UNKNOWN',
    startDate: anime.startDate,
    siteUrl: anime.siteUrl,
    quotes: generateQuotes(anime.title.romaji || anime.title.english)
  }));
}

function generateQuotes(title) {
  const templates = [
    `这是来自《${title}》的经典台词！`,
    `《${title}》中最令人难忘的瞬间`,
    `听！这是《${title}》的声音`,
    `猜猜看，这是哪部动画？`,
    `《${title}》的旋律响起...`
  ];
  return templates;
}

async function main() {
  try {
    const dataDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    let animeData;
    let useMockData = false;

    try {
      animeData = await fetchAniList(2026);
      
      if (!animeData || animeData.length === 0) {
        console.log('AniList 返回数据为空，使用模拟数据');
        animeData = generateMockData();
        useMockData = true;
      }
    } catch (error) {
      console.error('从 AniList 获取数据失败:', error.message);
      console.log('使用模拟数据作为备用...');
      animeData = generateMockData();
      useMockData = true;
    }

    const selectedAnime = selectTopAnime(animeData, TARGET_COUNT);
    const cardData = transformToCardData(selectedAnime);

    const output = {
      lastUpdated: new Date().toISOString(),
      source: useMockData ? 'mock' : 'anilist',
      year: 2026,
      total: cardData.length,
      anime: cardData
    };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');
    console.log(`\n成功保存 ${cardData.length} 部动画数据到 ${OUTPUT_FILE}`);
    
    console.log('\n动画列表:');
    cardData.forEach((anime, i) => {
      console.log(`${i + 1}. ${anime.name} (${anime.nameEn})`);
    });

  } catch (error) {
    console.error('脚本执行失败:', error);
    process.exit(1);
  }
}

main();
