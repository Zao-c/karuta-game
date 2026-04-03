#!/usr/bin/env node

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');
const { Command } = require('commander');
const inquirer = require('inquirer');

const program = new Command();

const OUTPUT_DIR = path.join(__dirname, 'output');
const HEADERS = {
    'Content-Type': 'text/html; charset=utf-8',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.100.4758.11 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
};

const log = (msg) => console.log(`[Bangumi] ${msg}`);
const error = (msg) => console.error(`[Error] ${msg}`);

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
    if (!str) return '';
    return str.replace(/[\*"\\\/<>:\|?]/g, ' ').trim();
}

function getNetabaSubjectUrl(bgmUrl) {
    try {
        const m = bgmUrl.match(/subject\/(\d+)/);
        if (m) {
            return `https://netaba.re/subject/${m[1]}`;
        }
    } catch (e) {
        error(`解析Netaba URL失败: ${e.message}`);
    }
    return null;
}

function detectAdaptationTypeFromPage($, url) {
    const detectedTypes = [];
    
    const tagSection = $('h2.subtitle');
    if (tagSection.text().includes('标注为')) {
        const allTags = [];
        tagSection.next('.inner').find('a.l.meta, a.l').each((i, el) => {
            const span = $(el).find('span');
            if (span.length) {
                allTags.push(span.text().trim());
            }
        });
        
        const adaptationKeywords = {
            "小说改编": ["轻小说改", "轻改", "小说改", "小说改编"],
            "漫画改编": ["漫画改", "漫画改编"],
            "游戏改编": ["游戏改", "游戏改编"],
            "原创动画": ["原创"]
        };
        
        for (const [category, keywords] of Object.entries(adaptationKeywords)) {
            for (const keyword of keywords) {
                if (allTags.some(tag => tag.includes(keyword))) {
                    if (!detectedTypes.includes(category)) {
                        detectedTypes.push(category);
                    }
                }
            }
        }
    }
    
    $('#infobox > li').each((i, el) => {
        const text = $(el).text();
        if (text.includes('原作') || text.includes('原案')) {
            if (text.includes('漫画') && !detectedTypes.includes("漫画改编")) {
                detectedTypes.push("漫画改编");
            } else if ((text.includes('小说') || text.includes('ノベル') || text.includes('ライトノベル')) && !detectedTypes.includes("小说改编")) {
                detectedTypes.push("小说改编");
            } else if ((text.includes('ゲーム') || text.includes('游戏')) && !detectedTypes.includes("游戏改编")) {
                detectedTypes.push("游戏改编");
            }
        }
    });
    
    return detectedTypes;
}

async function searchBangumi(name, pageNum = 1) {
    const searchUrl = `https://bgm.tv/subject_search/${encodeURIComponent(name)}?cat=2&page=${pageNum}`;
    log(`搜索: ${searchUrl}`);
    
    const html = await requestGet(searchUrl);
    if (!html) return null;
    
    const $ = parseHtml(html);
    const itemList = [];
    
    $('#browserItemList .inner').each((i, el) => {
        const $el = $(el);
        const typeSpan = $el.find('h3 span').attr('class') || '';
        
        if (typeSpan.includes('ico_subject_type subject_type_2')) {
            const title = $el.find('h3 a').text().trim();
            const info = $el.find('.info.tip').text().trim();
            const link = 'https://bgm.tv' + $el.find('h3 a').attr('href');
            
            itemList.push({
                title,
                info,
                link,
                type: 'anime'
            });
        }
    });
    
    if (itemList.length === 0) return null;
    return itemList;
}

async function getAnimeByUrl(url) {
    log(`获取动画信息: ${url}`);
    
    const html = await requestGet(url);
    if (!html) {
        error('无法获取页面内容');
        return null;
    }
    
    const $ = parseHtml(html);
    const info = {};
    
    if ($('#headerSubject').attr('typeof') !== 'v:Movie') {
        error('该作品不是动画！');
        return null;
    }
    
    const keywords = $('meta[name="keywords"]').attr('content') || '';
    info.CN = cleanFileName((keywords.split(',')[0] || '').trim());
    info.JP = cleanFileName((keywords.split(',')[1] || '').trim());
    info.fileName = info.CN || info.JP || '未知作品';
    info.type = $('small.grey').text().trim();
    info.rating = $("span[property='v:average']").text().trim() || '未知';
    
    let poster = $('div[align="center"] > a').attr('href') || '';
    poster = String(poster).replace('app://', 'http://').trim();
    info.Poster = poster.startsWith('http') ? poster : 'https://via.placeholder.com/300x450?text=无封面';
    
    const infobox = [];
    $('#infobox > li').each((i, el) => {
        infobox.push($(el).text());
    });
    const str = infobox.join('\n');
    
    const extractField = (regex, defaultVal = '未知') => {
        const match = regex.exec(str);
        return match ? match[1].trim().replace(/\n|\r/g, '').replace(/\s+/g, '') : defaultVal;
    };
    
    info.episode = extractField(/话数:.(\d*)/, '0');
    
    let website = extractField(/官方网站:\s*(.*)\n/, '未知');
    info.website = website.match('http') ? website : 'https://' + website;
    
    info.director = extractField(/导演:([^\n]*)/, '未知');
    info.AnimeMake = extractField(/动画制作:([^\n]*)/, '未知');
    info.music = extractField(/音乐:([^\n]*)/, '未知');
    
    let regstartdate;
    switch (info.type) {
        case 'TV': regstartdate = /放送开始:([^\n]*)/; break;
        case 'OVA': regstartdate = /发售日:([^\n]*)/; break;
        case '剧场版': regstartdate = /上映年度:([^\n]*)/; break;
        default: regstartdate = /放送开始:([^\n]*)/;
    }
    
    let startdate = extractField(regstartdate, '未知');
    if (startdate !== '未知') {
        try {
            const dateStr = startdate.replace('年', '-').replace('月', '-').replace('日', '');
            const dateObj = new Date(dateStr);
            const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
            startdate = `${startdate} ${weekdays[dateObj.getDay()]}`;
        } catch (e) {
            error(`日期转换失败: ${e.message}`);
        }
    }
    info.date = startdate;
    
    info.detectedCategories = detectAdaptationTypeFromPage($, url);
    info.url = url;
    
    return info;
}

function generateMarkdown(info, options = {}) {
    const now = new Date();
    const recordDate = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
    
    let seasonFolder = '未知季度', seasonYear = '';
    if (info.date && info.date.includes('年')) {
        const year = info.date.split('年')[0];
        seasonYear = year;
        const monthPart = info.date.split('年')[1];
        if (monthPart && monthPart.includes('月')) {
            const m = parseInt(monthPart.split('月')[0]);
            if (m === 12) seasonYear = (parseInt(year) + 1).toString();
            if ([12, 1, 2].includes(m)) seasonFolder = '01月新番';
            else if ([3, 4, 5].includes(m)) seasonFolder = '04月新番';
            else if ([6, 7, 8].includes(m)) seasonFolder = '07月新番';
            else if ([9, 10, 11].includes(m)) seasonFolder = '10月新番';
        }
    }
    
    const state = options.state || '想看';
    const catego = options.catego || info.detectedCategories[0] || '其它';
    
    let frontmatter = '---\n';
    const addField = (key, value) => frontmatter += `${key}: "${value || '未知'}"\n`;
    
    addField('中文名', info.CN);
    addField('日文名', info.JP);
    addField('cover', info.Poster);
    addField('改编类型', catego);
    addField('总集数', info.episode);
    addField('观看状态', state);
    addField('制作公司', info.AnimeMake);
    addField('监督', info.director);
    addField('音乐', info.music);
    addField('开播年份', seasonYear);
    addField('开播季度', seasonFolder);
    addField('记录日期', recordDate);
    addField('BGM链接', info.url);
    addField('BGM评分', info.rating);
    addField('tags', 'bangumi');
    
    frontmatter += '---\n\n';
    
    let content = frontmatter;
    content += `**已观看集数**： 0\n`;
    content += `**观看网址**： \n\n`;
    
    content += `# 动画信息\n`;
    content += `> [!bookinfo|noicon]+ **${info.CN || '未知作品'}**\n`;
    content += `> ![bookcover|400](${info.Poster})\n`;
    content += `>\n`;
    content += `| 项目 | 内容 |\n`;
    content += `|:------|:------------------------------------------|\n`;
    content += `| 中文名 | ${info.CN || '未知'} |\n`;
    content += `| 日文名 | ${info.JP || '未知'} |\n`;
    content += `| 开播日期 | ${info.date || '未知'} |\n`;
    content += `| 改编类型 | ${catego} |\n`;
    content += `| 动画集数 | ${info.type || ''} 共 ${info.episode || '0'} 话 |\n`;
    content += `| 制作公司 | ${info.AnimeMake || '未知'} |\n`;
    content += `| 监督 | ${info.director || '未知'} |\n`;
    content += `| 音乐 | ${info.music || '未知'} |\n`;
    content += `| BGM评分 | ${info.rating} |\n`;
    content += `| 官方网站 | [链接](${info.website}) |\n`;
    content += `| Bangumi | [链接](${info.url}) |\n\n`;
    
    content += `# 个人总结\n\n`;
    content += `待填写...\n`;
    
    return { content, seasonYear, seasonFolder };
}

async function ensureDir(dirPath) {
    try {
        await fs.mkdir(dirPath, { recursive: true });
    } catch (err) {
        if (err.code !== 'EEXIST') throw err;
    }
}

async function saveNote(fileName, content, seasonYear, seasonFolder) {
    const noteDir = seasonYear && seasonFolder !== '未知季度'
        ? path.join(OUTPUT_DIR, seasonYear, seasonFolder)
        : OUTPUT_DIR;
    
    await ensureDir(noteDir);
    
    const filePath = path.join(noteDir, `${fileName}.md`);
    await fs.writeFile(filePath, content, 'utf-8');
    
    log(`笔记已保存: ${filePath}`);
    return filePath;
}

async function interactiveMode(name) {
    if (!name) {
        const answer = await inquirer.prompt([
            {
                type: 'input',
                name: 'name',
                message: '请输入要搜索的动画名称:',
                validate: (input) => input.trim() ? true : '请输入名称'
            }
        ]);
        name = answer.name;
    }
    
    log(`搜索: ${name}`);
    const results = await searchBangumi(name);
    
    if (!results || results.length === 0) {
        error('未找到搜索结果');
        return;
    }
    
    const choices = results.map((r, i) => ({
        name: `${i + 1}. 🎞️ 《${r.title}》 - ${r.info}`,
        value: r
    }));
    
    const { selected } = await inquirer.prompt([
        {
            type: 'list',
            name: 'selected',
            message: '请选择动画:',
            choices
        }
    ]);
    
    const info = await getAnimeByUrl(selected.link);
    if (!info) return;
    
    log(`获取到动画信息: ${info.CN || info.JP}`);
    
    if (info.detectedCategories.length > 0) {
        log(`检测到改编类型: ${info.detectedCategories.join(', ')}`);
    }
    
    const ALL_CATEGORIES = ['小说改编', '漫画改编', '原创动画', '游戏改编', '其它'];
    const defaultCatego = info.detectedCategories[0] || '其它';
    
    const { state, catego } = await inquirer.prompt([
        {
            type: 'list',
            name: 'state',
            message: '观看状态:',
            choices: ['已看', '在看', '想看', '抛弃'],
            default: '想看'
        },
        {
            type: 'list',
            name: 'catego',
            message: '改编类型:',
            choices: ALL_CATEGORIES,
            default: defaultCatego
        }
    ]);
    
    const { content, seasonYear, seasonFolder } = generateMarkdown(info, { state, catego });
    const filePath = await saveNote(info.fileName, content, seasonYear, seasonFolder);
    
    log(`✅ 完成！笔记已保存到: ${filePath}`);
    
    return { info, filePath };
}

async function batchMode(names, state = '想看') {
    const results = [];
    
    for (const name of names) {
        log(`处理: ${name}`);
        
        const searchResults = await searchBangumi(name);
        if (!searchResults || searchResults.length === 0) {
            error(`未找到: ${name}`);
            continue;
        }
        
        const info = await getAnimeByUrl(searchResults[0].link);
        if (!info) continue;
        
        const { content, seasonYear, seasonFolder } = generateMarkdown(info, { state });
        const filePath = await saveNote(info.fileName, content, seasonYear, seasonFolder);
        
        results.push({ name, info, filePath });
        log(`✅ 完成: ${info.CN || info.JP}`);
        
        await new Promise(r => setTimeout(r, 1000));
    }
    
    return results;
}

program
    .name('bangumi-cli')
    .description('Bangumi动画信息抓取工具')
    .version('1.0.0')
    .argument('[name]', '动画名称')
    .option('-s, --state <state>', '观看状态 (已看/在看/想看/抛弃)', '想看')
    .option('-c, --catego <catego>', '改编类型')
    .option('-b, --batch <names>', '批量处理，多个名称用逗号分隔')
    .option('-o, --output <dir>', '输出目录', OUTPUT_DIR)
    .option('-j, --json', '输出JSON格式')
    .action(async (name, options) => {
        if (options.output) {
            global.OUTPUT_DIR = options.output;
        }
        
        await ensureDir(options.output);
        
        try {
            if (options.batch) {
                const names = options.batch.split(',').map(n => n.trim()).filter(Boolean);
                const results = await batchMode(names, options.state);
                
                if (options.json) {
                    console.log(JSON.stringify(results.map(r => ({
                        name: r.name,
                        title: r.info.CN || r.info.JP,
                        filePath: r.filePath
                    })), null, 2));
                }
            } else {
                const result = await interactiveMode(name);
                
                if (options.json && result) {
                    console.log(JSON.stringify({
                        title: result.info.CN || result.info.JP,
                        filePath: result.filePath
                    }, null, 2));
                }
            }
        } catch (err) {
            error(`执行失败: ${err.message}`);
            process.exit(1);
        }
    });

program.parse();
