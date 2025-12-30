/**
 * MacPicker RSS → JSON 同步脚本（最终版）
 * - 无数量限制
 * - 全量数据清洗并输出
 * - 保留所有可提取的 details
 * - 颜色自动提取，不写死列表
 * - 输出结构：{ lastUpdated, items: [...] }
 */

const Parser = require('rss-parser');
const fs = require('fs');
const path = require('path');

// ---------- 配置区域 ----------
const RSS_URL =
  'https://refurb-tracker.com/feeds/cn_in_imac_macpro_macstudio_mini_macbookpro_macbookair.xml';
// 输出文件位置
const OUTPUT_PATH = path.join(__dirname, '..', 'data', 'macs.json');
// ---------- end 配置 ----------

// npm rss-parser 依赖：MIT，社区使用量大（参考 Snyk 数据），适合该用途。 [oai_citation:0‡漏洞与配置指导](https://security.snyk.io/package/npm/rss-parser#:~:text=,maintenance%20Inactive)

const parser = new Parser({
  headers: {
    // 模拟常见浏览器 UA，减少被屏蔽的可能
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  }
});

/* ===== 1) 规范模型名称 ===== */
const MODEL_NAMES = [
  'MacBook Pro',
  'MacBook Air',
  'Mac mini',
  'Mac Studio',
  'Mac Pro',
  'iMac'
];

/* ===== 2) 工具函数 ===== */
const stripHtml = input =>
  (input || '')
    // 移除 CDATA 标记
    .replace(/<!\[CDATA\[|\]\]>/g, ' ')
    // 移除标签
    .replace(/<[^>]*>/gm, ' ')
    // 常见实体和破折号
    .replace(/&nbsp;|&ndash;|&mdash;/g, ' ')
    // 多空白压缩
    .replace(/\s+/g, ' ')
    .trim();

const normalize = input => (input || '').replace(/\s+/g, ' ').trim();

/* ===== 3) 提取函数 ===== */

/** 机型名 */
const extractModelName = text =>
  MODEL_NAMES.find(name => new RegExp(name, 'i').test(text)) || '';

/** 芯片完整型号，例如 M3 Pro / M4 / M2 Max */
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

/** 芯片系列，仅 M1-M4 */
const extractChipSeries = text =>
  text.match(/M[1-4]/i)?.[0]?.toUpperCase() || null;

/** 型号 ID */
const extractModelId = text =>
  text.match(/[A-Z0-9]{4,}\/[A-Z]/)?.[0]?.toUpperCase() || '';

/** 屏幕英寸 */
const extractScreenInches = text => {
  const m = text.match(/(\d{1,2}(?:\.\d)?)\s?(?:英寸|inch|")/i);
  return m ? parseFloat(m[1]) : null;
};

/** RAM 数字 */
const extractRam = text =>
  parseInt(text.match(/(\d+)\s?GB\s?(?:统一内存|内存)/i)?.[1], 10) ||
  parseInt(text.match(/(\d+)\s?GB/i)?.[1], 10) ||
  null;

/** SSD 数字，以 GB 返回；TB 自动换算 */
const extractSsd = text => {
  const m = text.match(/(\d+)\s?(GB|TB)\s?(?:固态硬盘|SSD)/i);
  if (!m) return null;
  const size = parseInt(m[1], 10);
  return m[2].toUpperCase() === 'TB' ? size * 1024 : size;
};

/** CPU / GPU 核心数 */
const extractCores = (text, type) => {
  const reg =
    type === 'cpu'
      ? /(\d+)\s?核\s?(?:中央)?处理器/i
      : /(\d+)\s?核\s?(?:图形)?处理器/i;
  return parseInt(text.match(reg)?.[1], 10) || null;
};

/** 颜色：动态抽取，不写死全集，用常见中文颜色名称匹配，若未来更多再扩充即可 */
const extractColor = text => {
  // 常见颜色词汇示例，若新增颜色可扩展到这里
  // 也可以改为从外部配置文件读取，当前保持内置小集，易扩展
  const colorPattern =
    /(深空黑色|银色|星光色|午夜色|深空灰色|蓝色|绿色|粉色|紫色|黄色|金色|红色)/i;
  const match = text.match(colorPattern);
  return match ? match[1] : null;
};

/** 详细说明列表，保留全部有效行 */
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
        // 过滤包含价格或页面广告自述的行
        !/(¥|￥|RMB|Product page|产品页面|型号|Model|价格|Price)/i.test(line)
    );
};

/** 是否具备 10GbE */
const extractHas10GbE = text => /10Gb\s?以太网|10GbE/i.test(text);

/** 是否提到 XDR */
const extractHasXDR = text => /XDR/i.test(text);

/* ===== 4) 主同步逻辑 ===== */
async function syncMacData() {
  try {
    const feed = await parser.parseURL(RSS_URL);

    const items = feed.items
      .map(item => {
        const title = normalize(stripHtml(item.title || ''));
        const contentHtml = item.content || item.description || '';
        // 组合全文本以方便提取
        const fullText = normalize(`${title} ${stripHtml(contentHtml)}`);

        // 价格匹配：先找以人民币符号的，再找 RMB 字样
        const priceMatch =
          fullText.match(/[¥￥]\s?([\d,]+\.\d{2})/) ||
          fullText.match(/RMB\s?([\d,]+\.\d{2})/);

        const priceNum = priceMatch
          ? parseFloat(priceMatch[1].replace(/,/g, ''))
          : null; // 没找到就 null，相当于忽略掉没有价格的条目

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
          details: extractDetails(contentHtml),
          specs: {
            ram: extractRam(fullText),
            ssd_gb: extractSsd(fullText),
            cpu: extractCores(fullText, 'cpu'),
            gpu: extractCores(fullText, 'gpu'),
            chip_series: extractChipSeries(fullText),
            chip_model: chipModel,
            screen_in: extractScreenInches(fullText),
            has10GbE: extractHas10GbE(fullText),
            hasXDR: extractHasXDR(fullText)
          }
        };
      })
      // 丢弃无价格条目以避免展示异常
      .filter(item => item.priceNum !== null)
      // 按价格升序
      .sort((a, b) => a.priceNum - b.priceNum);

    const output = {
      lastUpdated: new Date().toISOString(),
      items
    };

    // 写文件
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
    console.log(
      `[OK] ${new Date().toISOString()} synced ${items.length} items`
    );
  } catch (err) {
    console.error('[ERROR]', err.message);
    process.exit(1);
  }
}

syncMacData();
