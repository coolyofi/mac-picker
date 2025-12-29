const Parser = require('rss-parser');
const fs = require('fs');
const path = require('path');

const parser = new Parser({
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  }
});

const RSS_URL =
  'https://refurb-tracker.com/feeds/cn_in_imac_macpro_macstudio_mini_macbookpro_macbookair.xml';

const OUTPUT_PATH = path.join(__dirname, '..', 'data', 'macs.json');

async function syncMacData() {
  try {
    const feed = await parser.parseURL(RSS_URL);

    const processed = feed.items
      .map(item => {
        const title = item.title || '';
        const content = (item.content || item.description || '')
          .replace(/<[^>]*>/g, ' ')
          .replace(/&nbsp;/g, ' ');
        const text = `${title} ${content}`.replace(/\s+/g, ' ');

        const priceMatch =
          title.match(/RMB\s?([\d,]+\.\d{2})/) ||
          text.match(/[¥￥]\s?([\d,]+\.\d{2})/);

        const priceNum = priceMatch
          ? parseFloat(priceMatch[1].replace(/,/g, ''))
          : 0;

        const ram =
          parseInt(text.match(/(\d+)GB\s?(统一内存|内存)/)?.[1]) ||
          parseInt(text.match(/(\d+)GB/)?.[1]) ||
          8;

        let ssd = 256;
        const ssdMatch = text.match(/(\d+)(GB|TB)\s?固态硬盘/);
        if (ssdMatch) {
          ssd =
            ssdMatch[2] === 'TB'
              ? parseInt(ssdMatch[1]) * 1024
              : parseInt(ssdMatch[1]);
        }

        return {
          id: item.guid || Math.random().toString(36).slice(2),
          displayTitle: title.replace(/\s+/g, ' ').trim(),
          priceNum,
          link: item.link,
          specs: {
            ram,
            ssd_gb: ssd,
            has10GbE: text.includes('10Gb')
          }
        };
      })
      .sort((a, b) => a.priceNum - b.priceNum);

    fs.writeFileSync(
      OUTPUT_PATH,
      JSON.stringify(
        {
          lastUpdated: new Date().toISOString(),
          items: processed
        },
        null,
        2
      )
    );

    console.log(
      `[OK] ${new Date().toISOString()} synced ${processed.length} items`
    );
  } catch (err) {
    console.error('[ERROR]', err.message);
    process.exit(1);
  }
}

syncMacData();