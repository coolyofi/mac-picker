/**
 * MacPicker Pro
 * RSS → JSON 同步脚本（最终版）
 *
 * 设计原则：
 * - 不限制数量
 * - 不“理解”HTML，只拆行
 * - details 必须有内容
 * - 图片 / 颜色 / 规格全部来自 RSS 原文
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

/* ===== 工具函数 ===== */

const normalize = str =>
  (str || '').replace(/\s+/g, ' ').replace(/&nbsp;/g, ' ').trim();

const stripTags = html =>
  (html || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

/* ===== 图片提取 ===== */
const extractImage = html => {
  const m = html.match(/<img[^>]+src="([^"]+)"/i);
  return m ? m[1] : null;
};

/* ===== 颜色提取（来自标题或正文） ===== */
const extractColor = text => {
  const m = text.match(/-\s*([^\s]+色)/);
  return m ? m[1] : null;
};

/* ===== 型号 ===== */
const extractModelId = text =>
  text.match(/[A-Z0-9]{4,}\/[A-Z]/)?.[0]?.toUpperCase() || null;

/* ===== 芯片 ===== */
const extractChipModel = text => {
  const m = text.match(/M[1-4](?:\s?(?:Pro|Max|Ultra))?/i);
  return m ? normalize(m[0]) : null;
};

const extractChipSeries = text =>
  text.match(/M[1-4]/i)?.[0]?.toUpperCase() || null;

/* ===== 屏幕 ===== */
const extractScreenInches = text => {
  const m = text.match(/(\d{1,2}(?:\.\d)?)\s?(?:英寸|inch|")/i);
  return m ? parseFloat(m[1]) : null;
};

/* ===== RAM / SSD ===== */
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

/* ===== CPU / GPU ===== */
const extractCores = (text, type) => {
  const reg =
    type === 'cpu'
      ? /(\d+)\s?核\s?(?:中央)?处理器/i
      : /(\d+)\s?核\s?(?:图形)?处理器/i;
  return parseInt(text.match(reg)?.[1], 10) || null;
};

/* ===== details（关键） ===== */
const extractDetails = html => {
  if (!html) return [];

  // 1. 显式换行
  const withLines = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li>/gi, '\n');

  // 2. 移除 img / a，但保留文字
  const cleaned = withLines
    .replace(/<img[^>]*>/gi, '')
    .replace(/<a[^>]*>/gi, '')
    .replace(/<\/a>/gi, '');

  // 3. strip tag → 拆行
  return cleaned
    .split('\n')
    .map(l => normalize(stripTags(l)))
    .filter(Boolean)
    .filter(
      line =>
        !/^[¥￥]/.test(line) &&
        !/Product page/i.test(line) &&
        !/Apple Store/i.test(line)
    );
};

/* ===== 价格 ===== */
const extractPrice = text => {
  const m =
    text.match(/[¥￥]\s?([\d,]+\.\d{2})/) ||
    text.match(/RMB\s?([\d,]+\.\d{2})/i);
  return m ? parseFloat(m[1].replace(/,/g, '')) : null;
};

/* ===== 主流程 ===== */
async function syncMacData() {
  try {
    const feed = await parser.parseURL(RSS_URL);

    const items = feed.items
      .map(item => {
        const title = normalize(stripTags(item.title || ''));
        const contentHtml = item.content || item.description || '';
        const contentText = normalize(stripTags(contentHtml));
        const fullText = `${title} ${contentText}`;

        const priceNum = extractPrice(fullText);
        if (!priceNum) return null;

        const chipModel = extractChipModel(fullText);
        const modelName =
          ['MacBook Pro', 'MacBook Air', 'Mac mini', 'Mac Studio', 'Mac Pro', 'iMac']
            .find(m => new RegExp(m, 'i').test(fullText)) || '';

        return {
          id: item.guid || item.id,
          displayTitle:
            modelName && chipModel
              ? `${modelName} - ${chipModel}`
              : title,
          priceNum,
          link: item.link,
          modelId: extractModelId(fullText),
          color: extractColor(title),
          image: extractImage(contentHtml),
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
      .filter(Boolean)
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
      ),
      'utf-8'
    );

    console.log(`[OK] synced ${items.length} items`);
  } catch (err) {
    console.error('[ERROR]', err);
    process.exit(1);
  }
}

syncMacData();
