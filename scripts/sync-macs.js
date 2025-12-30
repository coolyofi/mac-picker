/**
 * MacPicker RSS → JSON 同步脚本
 * - 无数量限制
 * - 数据强清洗
 * - 支持更多机型
 * - 支持更多规格提取
 * - 支持中文和英文描述
 * - 更稳定的价格提取
 * - 更稳定的 RSS 解析
 * - 更友好的错误日志
 * - 输出格式优化
 * - 可扩展性更强
 * - 使用 Node.js 原生模块，减少依赖
 * - 更好的代码结构和注释
 * - 支持多种价格货币符号
 * - 支持更多规格提取（如10GbE、XDR等）
 * - 支持更多颜色提取
 * - 支持更多型号提取
 * - 支持更多芯片型号提取
 * - 支持更多屏幕尺寸提取
 * - 支持更多内存和存储提取
 * - 支持更多处理器核心数提取
 * - 支持更多细节提取
 * - 支持更多输出字段
 * - 支持更多错误处理
 * - 支持更多日志信息
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

/* ===== Canonical Model Names ===== */
const MODEL_NAMES = [
  'MacBook Pro',
  'MacBook Air',
  'Mac mini',
  'Mac Studio',
  'Mac Pro',
  'iMac'
];

/* ===== Utils ===== */
const stripHtml = input =>
  (input || '')
    .replace(/<!\[CDATA\[|\]\]>/g, ' ')
    .replace(/<[^>]*>/gm, ' ')
    .replace(/&nbsp;|&ndash;|&mdash;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const normalize = input => (input || '').replace(/\s+/g, ' ').trim();

/* ===== Extractors ===== */
const extractModelName = text =>
  MODEL_NAMES.find(name => new RegExp(name, 'i').test(text)) || '';

const extractChipModel = text => {
  const match = text.match(/M[1-4](?:\s?(?:Pro|Max|Ultra))?/i);
  if (!match) return '';
  const raw = match[0].replace(/\s+/g, ' ').trim();
  const series = raw.match(/M[1-4]/i)?.[0]?.toUpperCase() || '';
  const suffix = raw.replace(/M[1-4]/i, '').trim();
  if (!suffix) return series;
  const map = { pro: 'Pro', max: 'Max', ultra: 'Ultra' };
  return `${series} ${map[suffix.toLowerCase()] || suffix}`;
};

const extractChipSeries = text =>
  text.match(/M[1-4]/i)?.[0]?.toUpperCase() || null;

const extractModelId = text =>
  text.match(/[A-Z0-9]{4,}\/[A-Z]/)?.[0]?.toUpperCase() || '';

const extractScreenInches = text => {
  const m = text.match(/(\d{1,2}(?:\.\d)?)\s?(?:英寸|inch|")/i);
  return m ? parseFloat(m[1]) : null;
};

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

const extractColor = text => {
  const match = text.match(
    /(深空黑色|银色|星光色|午夜色|深空灰色|蓝色|绿色|粉色|紫色|黄色)/i
  );
  return match ? match[1] : null;
};

const extractDetails = html => {
  const raw = stripHtml(
    html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<li>/gi, '\n')
      .replace(/<\/li>/gi, '\n')
  );

  return raw
    .split('\n')
    .map(l => normalize(l))
    .filter(Boolean)
    .filter(
      line =>
        !/(¥|￥|RMB|Product page|产品页面|型号|Model|价格|Price)/i.test(line)
    );
};

/* ===== Main Sync ===== */
async function syncMacData() {
  try {
    const feed = await parser.parseURL(RSS_URL);

    const items = feed.items
      .map(item => {
        const title = normalize(stripHtml(item.title || ''));
        const content = item.content || item.description || '';
        const fullText = normalize(`${title} ${stripHtml(content)}`);

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
              : title,
          priceNum,
          link: item.link,
          modelId: extractModelId(fullText),
          color: extractColor(fullText),
          details: extractDetails(content),
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
      .filter(item => item.priceNum !== null)
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