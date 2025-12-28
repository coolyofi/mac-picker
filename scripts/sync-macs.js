const Parser = require('rss-parser');
const fs = require('fs');
const path = require('path');

const parser = new Parser({
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
      'AppleWebKit/537.36 (KHTML, like Gecko) ' +
      'Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/rss+xml,application/xml;q=0.9,*/*;q=0.8'
  }
});

const RSS_URL =
  'https://refurb-tracker.com/feeds/cn_in_imac_macpro_macstudio_mini_macbookpro_macbookair.xml';

// 始终写入仓库内的 data/macs.json
const OUTPUT_PATH = path.join(__dirname, '..', 'data', 'macs.json');

async function syncMacData() {
  try {
    const feed = await parser.parseURL(RSS_URL);

    const processedData = feed.items
      .map(item => {
        const title = item.title || '';
        const cleanContent = (item.content || item.description || '')
          .replace(/<[^>]*>?/gm, ' ')
          .replace(/&nbsp;/g, ' ');
        const fullText = (title + ' ' + cleanContent).replace(/\s+/g, ' ');

        // 价格
        const priceMatch =
          title.match(/RMB\s?([\d,]+\.\d{2})/) ||
          cleanContent.match(/[¥￥]\s?([\d,]+\.\d{2})/);
        const priceNum = priceMatch
          ? parseFloat(priceMatch[1].replace(/,/g, ''))
          : 0;

        // 内存
        const ramVal = parseInt(
          fullText.match(/(\d+)GB\s?(统一内存|内存)/)?.[1] ||
            fullText.match(/(\d+)GB/)?.[1] ||
            8,
          10
        );

        // SSD
        const ssdMatch = fullText.match(/(\d+)(GB|TB)\s?固态硬盘/);
        let ssdVal = 256;
        if (ssdMatch) {
          ssdVal =
            ssdMatch[2] === 'TB'
              ? parseInt(ssdMatch[1], 10) * 1024
              : parseInt(ssdMatch[1], 10);
        }

        // 型号
        const model = (
          fullText.match(/[A-Z0-9]{5,}[A-Z]\/A/)?.[0] || 'N/A'
        ).replace(/[^A-Z0-9\/]/g, '');

        // 设备名
        let deviceName = 'Mac';
        if (title.includes('MacBook Pro'))
          deviceName = title.includes('14')
            ? 'MacBook Pro 14"'
            : 'MacBook Pro 16"';
        else if (title.includes('MacBook Air'))
          deviceName = title.includes('13')
            ? 'MacBook Air 13"'
            : 'MacBook Air 15"';
        else if (title.includes('Mac mini')) deviceName = 'Mac mini';
        else if (title.includes('Mac Studio')) deviceName = 'Mac Studio';

        const chipMatch = fullText.match(
          /Apple\s(M[1-4]\s?(Max|Pro|Ultra|Chip)?)/
        );
        const chipName = chipMatch
          ? chipMatch[1].replace('Chip', '').trim()
          : 'M系列芯片';

        return {
          id: item.guid || Math.random().toString(36).slice(2),
          displayTitle: `${deviceName} - ${chipName}`,
          priceNum,
          link: item.link,
          specs: {
            ram: ramVal,
            ssd_gb: ssdVal,
            cpu: parseInt(
              fullText.match(/(\d+)\s?核中央处理器/)?.[1] || 0,
              10
            ),
            gpu: parseInt(
              fullText.match(/(\d+)\s?核图形处理器/)?.[1] || 0,
              10
            ),
            model,
            has10GbE:
              fullText.includes('10Gb 以太网') ||
              fullText.includes('10GbE')
          },
          cleanDetails: cleanContent
            .split('\n')
            .map(l => l.trim())
            .filter(
              l =>
                l.length > 5 &&
                !l.includes('Product page') &&
                !l.includes('¥') &&
                !l.includes(model)
            )
        };
      })
      .sort((a, b) => a.priceNum - b.priceNum);

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(processedData, null, 2));
    console.log(`[OK] 数据同步成功：${processedData.length} 台设备`);
  } catch (e) {
    console.error('同步失败:', e);
    process.exit(1);
  }
}

syncMacData();
