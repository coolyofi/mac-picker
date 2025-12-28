const Parser = require('rss-parser');
const fs = require('fs');
const parser = new Parser();

// 路径必须对应你 Next.js 项目中 index.js 读取的相对位置
const WEB_ROOT = '/www/wwwroot/macpicker.yofiqian.com/data'; 
const RSS_URL = 'https://refurb-tracker.com/feeds/cn_in_imac_macpro_macstudio_mini_macbookpro_macbookair.xml';

async function syncMacData() {
    try {
        const feed = await parser.parseURL(RSS_URL);
        const processedData = feed.items.map(item => {
            const title = item.title;
            // 彻底抹除 HTML，只留文本，防止 iOS 渲染非法 DOM
            const cleanContent = (item.content || item.description || "").replace(/<[^>]*>?/gm, ' ').replace(/&nbsp;/g, ' ');
            const fullText = (title + " " + cleanContent).replace(/\s+/g, ' ');

            // 1. 提取价格并转为纯数字 (用于 index.js 的排序)
            const priceMatch = title.match(/RMB\s?([\d,]+\.\d{2})/) || cleanContent.match(/[¥￥]\s?([\d,]+\.\d{2})/);
            const priceNum = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0;

            // 2. 提取规格并强制转为数字 (关键：适配 index.js 的筛选器)
            const ramVal = parseInt(fullText.match(/(\d+)GB\s?(统一内存|内存)/)?.[1] || fullText.match(/(\d+)GB/)?.[1] || 8);
            
            const ssdMatch = fullText.match(/(\d+)(GB|TB)\s?固态硬盘/);
            let ssdVal = 256;
            if (ssdMatch) {
                ssdVal = ssdMatch[2] === 'TB' ? parseInt(ssdMatch[1]) * 1024 : parseInt(ssdMatch[1]);
            }

            // 3. 型号纯净化 (去除 --)
            const model = (fullText.match(/[A-Z0-9]{5,}[A-Z]\/A/)?.[0] || "N/A").replace(/[^A-Z0-9\/]/g, '');

            // 4. 标题规范化：MacBook Pro 14" - M3 Pro (全称且用 - 连接)
            let deviceName = "Mac";
            if (title.includes("MacBook Pro")) deviceName = title.includes("14") ? "MacBook Pro 14\"" : "MacBook Pro 16\"";
            else if (title.includes("MacBook Air")) deviceName = title.includes("13") ? "MacBook Air 13\"" : "MacBook Air 15\"";
            else if (title.includes("Mac mini")) deviceName = "Mac mini";
            else if (title.includes("Mac Studio")) deviceName = "Mac Studio";

            const chipMatch = fullText.match(/Apple\s(M[1-4]\s?(Max|Pro|Ultra|Chip)?)/);
            const chipName = chipMatch ? chipMatch[1].replace('Chip', '').trim() : 'M系列芯片';

            return {
                id: item.guid || Math.random().toString(36),
                displayTitle: `${deviceName} - ${chipName}`,
                priceNum: priceNum,
                link: item.link,
                // specs 结构必须与 index.js 的过滤逻辑 100% 对齐
                specs: {
                    ram: ramVal,
                    ssd_gb: ssdVal,
                    cpu: parseInt(fullText.match(/(\d+)\s?核中央处理器/)?.[1] || 0),
                    gpu: parseInt(fullText.match(/(\d+)\s?核图形处理器/)?.[1] || 0),
                    model: model,
                    has10GbE: fullText.includes("10Gb 以太网") || fullText.includes("10GbE")
                },
                // 仅保留清洗后的纯文本行，杜绝 HTML 标签进入 JSON
                cleanDetails: cleanContent.split('\n')
                                .map(l => l.trim())
                                .filter(l => l.length > 5 && !l.includes("Product page") && !l.includes("¥") && !l.includes(model))
            };
        }).sort((a, b) => a.priceNum - b.priceNum);

        fs.writeFileSync(`${WEB_ROOT}/macs.json`, JSON.stringify(processedData, null, 2));
        console.log(`[OK] 数据同步成功：${processedData.length} 台设备已准备就绪。`);
    } catch (e) { console.error("同步失败:", e); }
}
syncMacData();