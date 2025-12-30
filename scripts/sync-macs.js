/**
 * MacPicker – RSS → JSON
 * 
 */

const Parser = require('rss-parser');
const fs = require('fs');
const path = require('path');

const parser = new Parser({
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  }
});

/* =========================
 * 基础配置
 * ========================= */

const RSS_URL =
  'https://refurb-tracker.com/feeds/cn_in_imac_macpro_macstudio_mini_macbookpro_macbookair.xml';

const OUTPUT_PATH = path.join(__dirname, '..', 'data', 'macs.json');

const MODEL_NAMES = [
  'MacBook Pro',
  'MacBook Air',
  'Mac mini',
  'Mac Studio',
  'Mac Pro',
  'iMac'
];

/* =========================
 * 工具函数
 * ========================= */

const stripHtml = input =>
  (input || '')
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/&nbsp;/g, ' ');

const normalizeWhitespace = input =>
  (input || '').replace(/\s+/g, ' ').trim();

/* =========================
 * 型号 / 芯片
 * ========================= */

const extractModelName = input =>
  MODEL_NAMES.find(name => new RegExp(name, 'i').test(input)) || '';

const extractChipModel = input => {
  const match = input.match(/M[1-4](?:\s?(?:Pro|Max|Ultra))?/i);
  if (!match) return '';

  const raw = match[0].replace(/\s+/g, ' ').trim();
  const series = raw.match(/M[1-4]/i)?.[0]?.toUpperCase() || '';
  const suffix = raw.replace(/M[1-4]/i, '').trim();

  if (!suffix) return series;

  const normalized =
    suffix.toLowerCase() === 'pro'
      ? 'Pro'
      : suffix.toLowerCase() === 'max'
      ? 'Max'
      : suffix.toLowerCase() === 'ultra'
      ? 'Ultra'
      : suffix;

  return `${series} ${normalized}`.trim();
};

const extractChipSeries = input =>
  input.match(/M[1-4]/i)?.[0]?.toUpperCase() || '';

/* =========================
 * 屏幕尺寸
 * ========================= */

const extractScreenInches = input => {
  const match = input.match(/(\d{1,2}(?:\.\d)?)\s?(?:-?inch|英寸|\")/i);
  return match ? parseFloat(match[1]) : null;
};

/* =========================
 * 型号 ID
 * ========================= */

const extractModelId = input => {
  const match = input.match(/[A-Z0-9]{4,}\/[A-Z]/i);
  return match ? match[0].replace(/[^A-Z0-9/]/gi, '').toUpperCase() : '';
};

/* =========================
 * 核心参数（数字化）
 * ========================= */

const extractRam = input =>
  parseInt(input.match(/(\d+)\s?GB\s?(?:统一内存|内存)/i)?.[1], 10) ||
  parseInt(input.match(/(\d+)\s?GB/i)?.[1], 10) ||
  8;

const extractSsd = input => {
  const match = input.match(/(\d+)\s?(GB|TB)\s?(?:固态硬盘|SSD)/i);
  if (!match) return 256;

  const size = parseInt(match[1], 10);
  return match[2].toUpperCase() === 'TB' ? size * 1024 : size;
};

const extractCoreCount = (input, type) => {
  if (type === 'cpu') {
    return (
      parseInt(input.match(/(\d+)\s?核\s?(?:中央)?处理器/i)?.[1], 10) ||
      null
    );
  }
  if (type === 'gpu') {
    return (
      parseInt(input.match(/(\d+)\s?核\s?(?:图形)?处理器/i)?.[1], 10) ||
      null
    );
  }
  return null;
};

/* =========================
 * 颜色（智能提取，非写死）
 * ========================= */

const COLOR_ZH_REGEX =
  /(?:-|–|，|,)\s*([^\d\-–,]{2,8}色)\s*(?:-|–|,|$)/;

const COLOR_EN_REGEX =
  /(Space Black|Midnight|Starlight|Silver|Gray|Blue|Green|Pink|Purple|Yellow)/i;

const extractColor = text => {
  if (!text) return '';

  const zh = text.match(COLOR_ZH_REGEX);
  if (zh) return zh[1].trim();

  const en = text.match(COLOR_EN_REGEX);
  if (en) return en[1].trim();

  return '';
};

/* =========================
 * 详情列表（纯文本）
 * ========================= */

const extractDetails = rawHtml => {
  const withBreaks = (rawHtml || '')
    .replace(/<li>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n');

  const cleaned = stripHtml(withBreaks);

  return cleaned
    .split('\n')
    .map(line => normalizeWhitespace(line))
    .filter(Boolean)
    .filter(
      line =>
        !/(RMB|[¥￥]|Product page|产品页面|型号|Model|价格|Price)/i.test(line)
    );
};

/* =========================
 * 主同步逻辑
 * ========================= */

async function syncMacData() {
  try {
    const feed = await parser.parseURL(RSS_URL);

    const items = feed.items
      .map(item => {
        const rawTitle = item.title || '';
        const rawContent = item.content || item.description || '';

        const title = normalizeWhitespace(stripHtml(rawTitle));
        const contentText = stripHtml(rawContent);
        const mergedText = normalizeWhitespace(`${title} ${contentText}`);

        const priceMatch =
          title.match(/[¥￥]\s?([\d,]+\.\d{2})/) ||
          mergedText.match(/[¥￥]\s?([\d,]+\.\d{2})/);

        const priceNum = priceMatch
          ? parseFloat(priceMatch[1].replace(/,/g, ''))
          : 0;

        const modelName = extractModelName(mergedText);
        const chipModel = extractChipModel(mergedText);

        const displayTitle =
          modelName && chipModel
            ? `${modelName} - ${chipModel}`
            : title;

        return {
          id: item.guid || Math.random().toString(36).slice(2),
          displayTitle,
          priceNum,
          link: item.link,
          modelId: extractModelId(mergedText),
          color: extractColor(title),
          details: extractDetails(rawContent),
          specs: {
            ram: extractRam(mergedText),
            ssd_gb: extractSsd(mergedText),
            cpu: extractCoreCount(mergedText, 'cpu'),
            gpu: extractCoreCount(mergedText, 'gpu'),
            chip_series: extractChipSeries(mergedText),
            chip_model: chipModel,
            screen_in: extractScreenInches(mergedText),
            has10GbE: /10Gb\s?以太网|10GbE/i.test(mergedText),
            hasXDR: /XDR/i.test(mergedText)
          }
        };
      })
      .sort((a, b) => a.priceNum - b.priceNum);

    fs.writeFileSync(
      OUTPUT_PATH,
      JSON.stringify(
        {
          lastUpdated: new Date().toISOString(),
          items
        },
        null,
        2
      )
    );

    console.log(
      `[OK] ${new Date().toISOString()} synced ${items.length} items`
    );
  } catch (err) {
    console.error('[ERROR]', err);
    process.exit(1);
  }
}

syncMacData();
