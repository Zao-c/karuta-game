const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, '..', 'public', 'data', 'anime_2025.json');
const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
};

const log = (msg) => console.log(`[Bangumi 2025] ${msg}`);
const error = (msg) => console.error(`[Error] ${msg}`);

const ANIME_2025_LIST = [
    "咒术回战 死灭回游",
    "葬送的芙莉莲",
    "地狱乐",
    "我推的孩子",
    "鬼灭之刃",
    "蓝色监狱",
    "间谍过家家",
    "电锯人",
    "我的英雄学院",
    "排球少年",
    "进击的巨人",
    "无职转生",
    "关于我转生变成史莱姆这档事",
    "刀剑神域",
    "Re:从零开始的异世界生活",
    "OVERLORD",
    "盾之勇者成名录",
    "平凡职业成就世界最强",
    "想要成为影之实力者",
    "魔王学院的不适任者",
    "魔法科高中的劣等生",
    "学战都市Asterisk",
    "最弱无败神装机龙",
    "落第骑士英雄谭",
    "精灵幻想记",
    "世界顶尖的暗杀者转生为异世界贵族",
    "转生贵族的异世界冒险录",
    "异世界药局",
    "骸骨骑士大人异世界冒险中",
    "转生就是蜘蛛又怎样",
    "我是蜘蛛又怎样",
    "熊熊勇闯异世界",
    "为了养老金去异世界存八万金币",
    "异世界食堂",
    "爆肝工程师的异世界狂想曲",
    "贤者之孙",
    "带着智慧型手机闯荡异世界",
    "异世界超能魔术师",
    "慎重勇者",
    "这个勇者明明超强却过分慎重",
    "众神的恶作剧",
    "打工吧魔王大人",
    "入间同学入魔了",
    "蓝色时期",
    "排球少年 垃圾场的决战",
    "咒术回战 0",
    "鬼灭之刃 柱训练篇",
    "蓝色监狱 第二季",
    "我推的孩子 第二季",
    "地狱乐 第二季",
    "葬送的芙莉莲 第二季",
    "迷宫饭",
    "物语系列",
    "化物语",
    "伪物语",
    "猫物语",
    "物语系列 第二季",
    "凭物语",
    "历物语",
    "终物语",
    "续终物语",
    "伤物语",
    "青春猪头少年不会梦到兔女郎学姐",
    "青春猪头少年",
    "青春野犬",
    "文豪野犬",
    "夏目友人帐",
    "紫罗兰永恒花园",
    "紫罗兰永恒花园 剧场版",
    "天气之子",
    "你的名字",
    "铃芽之旅",
    "千与千寻",
    "哈尔的移动城堡",
    "龙猫",
    "天空之城",
    "风之谷",
    "幽灵公主",
    "悬崖上的金鱼姬",
    "起风了",
    "红猪",
    "魔女宅急便",
    "侧耳倾听",
    "借东西的小人阿莉埃蒂",
    "辉夜姬物语",
    "回忆中的玛妮",
    "萤火虫之墓",
    "红海龟",
    "种山原之夜",
];

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function requestGet(url) {
    try {
        const response = await axios.get(url, { 
            headers: HEADERS, 
            timeout: 15000,
            validateStatus: (status) => status < 500
        });
        return response.data;
    } catch (err) {
        error(`请求失败: ${err.message}`);
        return null;
    }
}

function parseHtml(html) {
    return cheerio.load(html);
}

function cleanFileName(str) {
    return str ? str.replace(/[\*"\\\/<>:\|?]/g, ' ').trim() : '';
}

async function searchBangumi(name) {
    const url = `https://bgm.tv/subject_search/${encodeURIComponent(name)}?cat=2`;
    const html = await requestGet(url);
    if (!html) return null;
    
    const $ = parseHtml(html);
    const results = [];
    
    $('#browserItemList .inner').each((i, el) => {
        const $el = $(el);
        const typeClass = $el.find('h3 span').attr('class') || '';
        
        if (typeClass.includes('subject_type_2')) {
            results.push({
                title: $el.find('h3 a').text().trim(),
                info: $el.find('.info.tip').text().trim(),
                link: 'https://bgm.tv' + $el.find('h3 a').attr('href')
            });
        }
    });
    
    return results.length > 0 ? results : null;
}

async function getAnimeByUrl(url) {
    const html = await requestGet(url);
    if (!html) return null;
    
    const $ = parseHtml(html);
    
    if ($('#headerSubject').attr('typeof') !== 'v:Movie') {
        return null;
    }
    
    const keywords = $('meta[name="keywords"]').attr('content') || '';
    const info = {
        bgmId: url.match(/subject\/(\d+)/)?.[1] || '',
        CN: cleanFileName(keywords.split(',')[0] || ''),
        JP: cleanFileName(keywords.split(',')[1] || ''),
        type: $('small.grey').text().trim(),
        rating: parseFloat($("span[property='v:average']").text().trim()) || 0,
        ratingCount: parseInt($('.chart_desc span').text().replace(/[^\d]/g, '')) || 0,
        Poster: $('div[align="center"] > a').attr('href') || '',
        url
    };
    
    info.name = info.CN || info.JP || '未知';
    info.Poster = info.Poster.replace('app://', 'http://');
    if (!info.Poster.startsWith('http')) {
        info.Poster = '';
    }
    
    const infoboxText = $('#infobox').text();
    const extract = (regex, def = '') => {
        const m = regex.exec(infoboxText);
        return m ? m[1].trim() : def;
    };
    
    info.episodes = parseInt(extract(/话数:.(\d+)/, '0')) || 0;
    info.director = extract(/导演:([^\n]+)/);
    info.studio = extract(/动画制作:([^\n]+)/);
    info.startDate = extract(/放送开始:([^\n]+)/);
    
    const genres = [];
    $('#infobox a[href*="/tag/"]').each((i, el) => {
        genres.push($(el).text().trim());
    });
    info.genres = genres.slice(0, 5);
    
    return info;
}

async function main() {
    log('开始获取2025年动画数据...');
    
    const allAnime = [];
    const seenIds = new Set();
    
    for (const name of ANIME_2025_LIST) {
        log(`搜索: ${name}`);
        
        const results = await searchBangumi(name);
        if (!results || results.length === 0) {
            log(`  未找到结果`);
            await sleep(500);
            continue;
        }
        
        const firstResult = results[0];
        const bgmId = firstResult.link.match(/subject\/(\d+)/)?.[1];
        
        if (bgmId && seenIds.has(bgmId)) {
            log(`  已存在: ${firstResult.title}`);
            await sleep(500);
            continue;
        }
        
        log(`  获取详情: ${firstResult.title}`);
        const info = await getAnimeByUrl(firstResult.link);
        
        if (info) {
            if (!seenIds.has(info.bgmId)) {
                seenIds.add(info.bgmId);
                allAnime.push(info);
                log(`  ✅ 添加: ${info.name} (评分: ${info.rating})`);
            }
        }
        
        await sleep(800);
    }
    
    allAnime.sort((a, b) => b.rating - a.rating);
    
    const output = {
        lastUpdated: new Date().toISOString(),
        source: 'bangumi',
        year: 2025,
        total: allAnime.length,
        anime: allAnime.map((a, i) => ({
            id: `anime_${a.bgmId}`,
            name: a.name,
            nameCn: a.CN,
            nameJp: a.JP,
            coverImage: a.Poster,
            rating: a.rating,
            ratingCount: a.ratingCount,
            episodes: a.episodes,
            type: a.type,
            studio: a.studio,
            director: a.director,
            startDate: a.startDate,
            genres: a.genres,
            bgmUrl: a.url
        }))
    };
    
    await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');
    
    log(`\n✅ 完成！共获取 ${allAnime.length} 部动画`);
    log(`保存到: ${OUTPUT_FILE}`);
    
    console.log('\n动画列表（按评分排序）:');
    allAnime.slice(0, 20).forEach((a, i) => {
        console.log(`${i + 1}. ${a.name} - 评分: ${a.rating}`);
    });
}

main().catch(err => {
    error(err.message);
    process.exit(1);
});
