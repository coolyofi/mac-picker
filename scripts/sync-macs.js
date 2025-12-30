/**
 * MacPicker RSS → JSON 同步脚本（最终版）
 *
 * 设计原则：
 * - 不限制数量（支持 300+ / 1000+）
 * - 彻底保留 RSS 中的「规格明细」
 * - details = 官方规格完整列表（顺序不乱）
 * - specs = 从 details / title 派生的结构化字段
 * - 绝不提前 strip HTML 破坏结构
 */

const Parser = require('rss-parser');
const fs = require('fs');
const path = require('path');

const parser = new Parser({
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  }
});

const RSS_URL =
  'https://refurb-tracker.com/feeds/cn_in_imac_macpro_macstudio_mini_macbookpro_macbookair.xml';

const OUTPUT_PATH = path.join(__dirname, '..', 'data', 'macs.json');

/* =========================
   Canonical Model Names
========================= */
const MODEL_NAMES = [
  'MacBook Pro',
  'MacBook Air',
  'Mac mini',
  'Mac Studio',
  'Mac Pro',
  'iMac'
];

/* =========================
   Utils
========================= */
const normalize = s => (s || '').replace(/\s+/g, ' ').trim();

const stripInlineHtml = s =>
  (s || '')
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;|&ndash;|&mdash;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/* =========================
   Extractors (High-level)
========================= */
const extractModelName = text =>
  MODEL_NAMES.find(name => new RegExp(name, 'i').test(text)) || null;

const extractChipModel = text => {
  const m = text.match(/M[1-4](?:\s?(?:Pro|Max|Ultra))?/i);
  if (!m) return null;
  const raw = m[0].replace(/\s+/g, ' ').trim();
  const series = raw.match(/M[1-4]/i)[0].toUpperCase();
  const suffix = raw.replace(/M[1-4]/i, '').trim();
  if (!suffix) return series;
  return `${series} ${suffix.charAt(0).toUpperCase()}${suffix.slice(1)}`;
};

const extractChipSeries = text =>
  text.match(/M[1-4]/i)?.[0]?.toUpperCase() || null;

const extractModelId = text =>
  text.match(/[A-Z0-9]{4,}\/[A-Z]/)?.[0]?.toUpperCase() || null;

/* =========================
   Specs Extractors
========================= */
const extractRam = text =>
  parseInt(text.match(/(\d+)\s?GB\s?(?:统一内存|内存)/i)?.[1], 10) ||
  parseInt(text.match(/(\d+)\s?GB/i)?.[1], 10) ||
  null;

const extractSsd = text => {
  const m = text.match(/(\d+)\s?(GB|TB)\s?(?:固态硬盘|SSD)/i);
  if (!m) return null;
  const size = parseInt(m[1], 10);
  return m[2].toUpperCase() === 'TB' ? size * 1024 : size;
};

const extractCores = (text, type) => {
  const reg =
    type === 'cpu'
      ? /(\d+)\s?核\s?(?:中央)?处理器/i
      : /(\d+)\s?核\s?(?:图形)?处理器/i;
  return parseInt(text.match(reg)?.[1], 10) || null;
};

const extractScreenInches = text => {
  const m = text.match(/(\d{1,2}(?:\.\d)?)\s?(?:英寸|inch|")/i);
  return m ? parseFloat(m[1]) : null;
};

const extractColor = text => {
  const m = text.match(
    /(深空黑色|银色|星光色|午夜色|深空灰色|蓝色|绿色|粉色|紫色|黄色)/i
  );
  return m ? m[1] : null;
};

/* =========================
   Details Extraction (CORE)
========================= */
/**
 * 核心规则：
 * - 先把 <br> / <li> 转成「行」
 * - 再 strip HTML
 * - 不删除规格语句
 * - 只剔除价格 / 广告跳转
 */
const extractDetails = html => {
  if (!html) return [];

  const withLines = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li>/gi, '\n')
    .replace(/<\/li>/gi, '\n');

  const raw = stripInlineHtml(withLines);

  return raw
    .split('\n')
    .map(l => normalize(l))
    .filter(Boolean)
    .filter(
      l =>
        !/(¥|￥|RMB|Product page|产品页面|Apple Store)/i.test(l)
    );
};

/* =========================
   Main Sync
========================= */
async function syncMacData() {
  try {
    const feed = await parser.parseURL(RSS_URL);

    const items = feed.items
      .map(item => {
        const titleText = normalize(stripInlineHtml(item.title || ''));
        const contentHtml = item.content || item.description || '';
        const fullText = normalize(
          `${titleText} ${stripInlineHtml(contentHtml)}`
        );

        const priceMatch =
          fullText.match(/[¥￥]\s?([\d,]+\.\d{2})/) ||
          fullText.match(/RMB\s?([\d,]+\.\d{2})/);

        const priceNum = priceMatch
          ? parseFloat(priceMatch[1].replace(/,/g, ''))
          : null;

        const modelName = extractModelName(fullText);
        const chipModel = extractChipModel(fullText);

        return {
          id: item.guid || item.id || Math.random().toString(36).slice(2),
          displayTitle:
            modelName && chipModel
              ? `${modelName} - ${chipModel}`
              : titleText,
          priceNum,
          link: item.link,
          modelId: extractModelId(fullText),
          color: extractColor(fullText),
          details: extractDetails(contentHtml),
          specs: {
            ram: extractRam(fullText),
            ssd_gb: extractSsd(fullText),
            cpu: extractCores(fullText, 'cpu'),
            gpu: extractCores(fullText, 'gpu'),
            chip_series: extractChipSeries(fullText),
            chip_model: chipModel,
            screen_in: extractScreenInches(fullText),
            has10GbE: /10Gb\s?以太网|10GbE/i.test(fullText),
            hasXDR: /XDR/i.test(fullText)
          }
        };
      })
      .filter(i => i.priceNum !== null)
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