const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'data', 'bangumi');
const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.100.4758.11 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8',
};

const log = (msg) => console.log(`[Bangumi] ${msg}`);
const error = (msg) => console.error(`[Error] ${msg}`);

async function requestGet(url) {
    try {
        const response = await axios.get(url, { headers: HEADERS, timeout: 15000 });
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

function detectAdaptationType($) {
    const detectedTypes = [];
    
    const tagSection = $('h2.subtitle');
    if (tagSection.text().includes('标注为')) {
        const allTags = [];
        tagSection.next('.inner').find('a.l span').each((i, el) => {
            allTags.push($(el).text().trim());
        });
        
        const keywords = {
            "小说改编": ["轻小说改", "轻改", "小说改"],
            "漫画改编": ["漫画改", "漫画改编"],
            "游戏改编": ["游戏改", "游戏改编"],
            "原创动画": ["原创"]
        };
        
        for (const [cat, kws] of Object.entries(keywords)) {
            for (const kw of kws) {
                if (allTags.some(t => t.includes(kw)) && !detectedTypes.includes(cat)) {
                    detectedTypes.push(cat);
                }
            }
        }
    }
    
    return detectedTypes;
}

async function searchBangumi(name) {
    const url = `https://bgm.tv/subject_search/${encodeURIComponent(name)}?cat=2`;
    log(`搜索: ${url}`);
    
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
    log(`获取: ${url}`);
    
    const html = await requestGet(url);
    if (!html) return null;
    
    const $ = parseHtml(html);
    
    if ($('#headerSubject').attr('typeof') !== 'v:Movie') {
        error('不是动画类型');
        return null;
    }
    
    const keywords = $('meta[name="keywords"]').attr('content') || '';
    const info = {
        CN: cleanFileName(keywords.split(',')[0] || ''),
        JP: cleanFileName(keywords.split(',')[1] || ''),
        type: $('small.grey').text().trim(),
        rating: $("span[property='v:average']").text().trim() || '未知',
        Poster: $('div[align="center"] > a').attr('href') || '',
        url
    };
    
    info.fileName = info.CN || info.JP || '未知';
    info.Poster = info.Poster.replace('app://', 'http://');
    if (!info.Poster.startsWith('http')) {
        info.Poster = 'https://via.placeholder.com/300x450?text=无封面';
    }
    
    const infoboxText = $('#infobox').text();
    const extract = (regex, def = '未知') => {
        const m = regex.exec(infoboxText);
        return m ? m[1].trim() : def;
    };
    
    info.episode = extract(/话数:.(\d+)/, '0');
    info.director = extract(/导演:([^\n]+)/);
    info.AnimeMake = extract(/动画制作:([^\n]+)/);
    info.music = extract(/音乐:([^\n]+)/);
    info.date = extract(/放送开始:([^\n]+)/);
    
    info.detectedCategories = detectAdaptationType($);
    
    return info;
}

function generateMarkdown(info, options = {}) {
    const now = new Date();
    const recordDate = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
    
    let seasonYear = '', seasonFolder = '未知季度';
    if (info.date && info.date.includes('年')) {
        seasonYear = info.date.split('年')[0];
        const m = parseInt(info.date.split('年')[1]);
        if ([12, 1, 2].includes(m)) seasonFolder = '01月新番';
        else if ([3, 4, 5].includes(m)) seasonFolder = '04月新番';
        else if ([6, 7, 8].includes(m)) seasonFolder = '07月新番';
        else if ([9, 10, 11].includes(m)) seasonFolder = '10月新番';
    }
    
    const state = options.state || '想看';
    const catego = options.catego || info.detectedCategories?.[0] || '其它';
    
    let md = `---
中文名: "${info.CN}"
日文名: "${info.JP}"
cover: "${info.Poster}"
改编类型: "${catego}"
总集数: "${info.episode}"
观看状态: "${state}"
制作公司: "${info.AnimeMake}"
监督: "${info.director}"
音乐: "${info.music}"
开播年份: "${seasonYear}"
开播季度: "${seasonFolder}"
记录日期: "${recordDate}"
BGM链接: "${info.url}"
BGM评分: "${info.rating}"
tags: "bangumi"
---

**已观看集数**： 0
**观看网址**： 

# 动画信息

| 项目 | 内容 |
|:------|:------------------------------------------|
| 中文名 | ${info.CN || '未知'} |
| 日文名 | ${info.JP || '未知'} |
| 开播日期 | ${info.date || '未知'} |
| 改编类型 | ${catego} |
| 动画集数 | ${info.type || ''} 共 ${info.episode || '0'} 话 |
| 制作公司 | ${info.AnimeMake || '未知'} |
| 监督 | ${info.director || '未知'} |
| 音乐 | ${info.music || '未知'} |
| BGM评分 | ${info.rating} |

# 个人总结

待填写...
`;
    
    return { md, seasonYear, seasonFolder };
}

async function ensureDir(dir) {
    try {
        await fs.mkdir(dir, { recursive: true });
    } catch (e) {
        if (e.code !== 'EEXIST') throw e;
    }
}

async function fetchAnime(name, options = {}) {
    log(`搜索动画: ${name}`);
    
    const results = await searchBangumi(name);
    if (!results || results.length === 0) {
        error(`未找到: ${name}`);
        return null;
    }
    
    log(`找到 ${results.length} 个结果，选择第一个`);
    
    const info = await getAnimeByUrl(results[0].link);
    if (!info) return null;
    
    log(`获取成功: ${info.CN || info.JP}`);
    
    const { md, seasonYear, seasonFolder } = generateMarkdown(info, options);
    
    const noteDir = seasonYear 
        ? path.join(OUTPUT_DIR, seasonYear, seasonFolder)
        : OUTPUT_DIR;
    
    await ensureDir(noteDir);
    
    const filePath = path.join(noteDir, `${info.fileName}.md`);
    await fs.writeFile(filePath, md, 'utf-8');
    
    log(`✅ 已保存: ${filePath}`);
    
    return { info, filePath };
}

async function batchFetch(names, options = {}) {
    const results = [];
    
    for (const name of names) {
        const result = await fetchAnime(name, options);
        if (result) results.push(result);
        await new Promise(r => setTimeout(r, 1000));
    }
    
    return results;
}

async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log(`
Bangumi CLI - 动画信息抓取工具

用法:
  node bangumi-fetch.js <动画名称>           搜索单个动画
  node bangumi-fetch.js <名称> --state 在看  指定观看状态
  node bangumi-fetch.js --batch 名称1,名称2  批量处理

示例:
  node bangumi-fetch.js "咒术回战"
  node bangumi-fetch.js "葬送的芙莉莲" --state 在看
  node bangumi-fetch.js --batch "咒术回战,地狱乐"
`);
        return;
    }
    
    const batchIndex = args.indexOf('--batch');
    const stateIndex = args.indexOf('--state');
    
    if (batchIndex !== -1) {
        const names = args[batchIndex + 1]?.split(',').map(n => n.trim()).filter(Boolean) || [];
        const state = stateIndex !== -1 ? args[stateIndex + 1] : '想看';
        await batchFetch(names, { state });
    } else {
        const name = args[0];
        const state = stateIndex !== -1 ? args[stateIndex + 1] : '想看';
        await fetchAnime(name, { state });
    }
}

main().catch(err => {
    error(err.message);
    process.exit(1);
});

module.exports = { fetchAnime, batchFetch, searchBangumi, getAnimeByUrl };
