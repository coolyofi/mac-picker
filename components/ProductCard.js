import { useState, useEffect, useRef, useCallback } from "react";

function fmtPrice(n) {
  const v = Number(n || 0);
  if (!Number.isFinite(v) || v <= 0) return "—";
  return `¥${Math.round(v).toLocaleString("zh-CN")}`;
}

function pickColorText(data) {
  return data?.color || data?.specs?.color || "";
}

function hasXDR(details = []) {
  const text = (details || []).join(" ");
  return /XDR|Liquid\s*视网膜\s*XDR|Liquid\s*Retina\s*XDR/i.test(text);
}

function has10GE(specs) {
  return !!specs?.has10GbE;
}

export default function ProductCard({ data }) {
  const [flipped, setFlipped] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const s = data?.specs || {};
  const title = data?.displayTitle || "Unknown Mac";
  const modelId = data?.modelId || "";
  const img = data?.image || data?.imageUrl || data?.image_url || "";
  const details = Array.isArray(data?.details) ? data.details : [];
  const color = pickColorText(data);

  const xdr = hasXDR(details);
  const tenge = has10GE(s);

  const cpu = Number.isFinite(Number(s?.cpu)) ? Number(s.cpu) : null;
  const gpu = Number.isFinite(Number(s?.gpu)) ? Number(s.gpu) : null;
  const ram = Number.isFinite(Number(s?.ram)) ? Number(s.ram) : null;
  const ssd = Number.isFinite(Number(s?.ssd_gb)) ? Number(s.ssd_gb) : null;

  const buy = data?.buyLink || data?.purchase || data?.link || "";

  // Prepare back heading: use the first meaningful detail as back heading
  const filteredDetails = details.filter(line => !line.includes("&ndash;") && !line.includes("– FGND3CH/A") && !line.includes("– G15S3CH/A"));
  const backHeading = filteredDetails.length ? filteredDetails[0] : "";
  const restDetails = filteredDetails.slice(1);

  const backTitleRef = useRef(null);
  const pcTitleRef = useRef(null);

  // 准备Tag列表
  const allTags = [
    cpu !== null ? { type: 'cpu', content: `CPU ${cpu}`, className: 'pc-tag--cpu' } : null,
    gpu !== null ? { type: 'gpu', content: `GPU ${gpu}`, className: 'pc-tag--gpu' } : null,
    color ? { type: 'color', content: color, className: 'pc-tag--color' } : null,
    ram !== null ? { type: 'ram', content: `RAM ${ram}GB`, className: 'pc-tag--ram' } : null,
    ssd !== null ? { type: 'ssd', content: `SSD ${ssd}GB`, className: 'pc-tag--ssd' } : null,
    xdr ? { type: 'xdr', content: 'XDR', className: 'pc-tag--xdr' } : null,
    tenge ? { type: '10ge', content: '10GE', className: 'pc-tag--10ge' } : null,
  ].filter(Boolean);

  // 根据设备类型确定最大显示Tag数量
  const [maxTags, setMaxTags] = useState(6);

  const updateMaxTags = useCallback(() => {
    if (typeof window === 'undefined') return;
    const width = window.innerWidth;
    if (width <= 480) setMaxTags(3); // 移动端
    else if (width <= 768) setMaxTags(4); // 平板端
    else setMaxTags(6); // 桌面端
  }, []);

  useEffect(() => {
    updateMaxTags();
    window.addEventListener('resize', updateMaxTags);
    return () => window.removeEventListener('resize', updateMaxTags);
  }, [updateMaxTags]);

  const visibleTags = allTags.slice(0, maxTags);
  const hiddenCount = allTags.length - maxTags;
  const hasHiddenTags = hiddenCount > 0;

  // Auto-shrink back small title if it overflows the 2-line clamp
  useEffect(() => {
    const el = backTitleRef.current;
    if (!el || !backHeading) return;

    // start from base size (keep in sync with CSS default)
    let size = 13;
    const min = 10;
    const step = 0.5;
    el.style.fontSize = size + 'px';

    const check = () => {
      // if still overflowing and we can shrink, reduce size and retry
      if (el.scrollHeight > el.clientHeight + 1 && size > min) {
        size = Math.max(min, +(size - step).toFixed(2));
        el.style.fontSize = size + 'px';
        requestAnimationFrame(check);
      }
    };

    requestAnimationFrame(check);

    const onResize = () => {
      size = 13;
      el.style.fontSize = size + 'px';
      requestAnimationFrame(check);
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [backHeading]);

  // Ensure front product title does not wrap; if it does across cards,
  // progressively reduce the global page title size (CSS var --mp-title-size)
  useEffect(() => {
    const el = pcTitleRef.current;
    if (!el) return;

    const checkAndAdjust = () => {
      // if title is overflowing (would wrap/truncate)
      const isOverflowing = el.scrollWidth > el.clientWidth + 1;
      if (!isOverflowing) return;

      const pageTitleEl = document.querySelector('.mp-title');
      if (!pageTitleEl) return;

      // read current title size from css var or computed style
      const root = document.documentElement;
      const current = getComputedStyle(root).getPropertyValue('--mp-title-size').trim() || null;
      let size = null;
      if (current && current.endsWith('px')) {
        size = parseFloat(current);
      } else {
        size = parseFloat(getComputedStyle(pageTitleEl).fontSize) || 42;
      }

      const minSize = 28; // do not shrink page title below this
      const step = 2; // shrink step in px

      // only adjust if not already at or below min
      while (el.scrollWidth > el.clientWidth + 1 && size > minSize) {
        size = Math.max(minSize, size - step);
        root.style.setProperty('--mp-title-size', size + 'px');
        // force reflow for measurement
        // eslint-disable-next-line no-unused-expressions
        pageTitleEl.offsetWidth;
        if (size === minSize) break;
      }
    };

    // run after a tick to allow layout
    requestAnimationFrame(checkAndAdjust);

    window.addEventListener('resize', checkAndAdjust);
    return () => window.removeEventListener('resize', checkAndAdjust);
  }, [title]);

  // 移除动态Tag调整代码，使用静态CSS布局避免卡顿

  const handleFlip = () => setFlipped(!flipped);

  useEffect(() => {
    if (flipped) {
      const timer = setTimeout(() => setFlipped(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [flipped]);

  return (
    <article
      className={`pc ${hovered ? "pc-hovered" : ""}`}
      onClick={handleFlip}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={`pc-flip ${flipped ? "pc-flipped" : ""}`}>
        {/* Front */}
        <div className="pc-face pc-front">
          <div className="pc-top">
            <div className="pc-titleWrap">
              <div className="pc-title" ref={pcTitleRef}>{title}</div>
              
              {modelId ? <div className="pc-model">{modelId}</div> : null}
            </div>

            <div className="pc-price">{fmtPrice(data?.priceNum)}</div>
          </div>

          <div className="pc-sep" />

          {/* image with overlay tags */}
          <div className="pc-imgContainer">
            <div className="pc-img">
              {img ? (
                <img
                  src={img}
                  alt={modelId || title}
                  loading="lazy"
                  onLoad={() => setImageLoaded(true)}
                  style={{ opacity: imageLoaded ? 1 : 0.5 }}
                />
              ) : (
                <div className="pc-imgPh">No Image</div>
              )}
            </div>

            {/* tags overlay on image */}
            <div className="pc-tagsOverlay">
              <div className="pc-tagRow">
                {visibleTags.map((tag, idx) => (
                  <span key={tag.type} className={`pc-tag ${tag.className}`}>
                    {tag.content}
                  </span>
                ))}
                {hasHiddenTags && (
                  <span className="pc-tag pc-tag--more" title={`还有 ${hiddenCount} 个标签`}>
                    +{hiddenCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Back */}
        <div className="pc-face pc-back">
          <div className="pc-backContent">
              {backHeading ? (
                <div className="pc-backSmallTitle" ref={backTitleRef}>{backHeading}</div>
              ) : null}

              <div className="pc-sep" />

              {restDetails.length ? (
                <ul className="pc-list">
                  {restDetails.map((line, idx) => (
                    <li key={`${modelId || title}-rest-${idx}`}>{line}</li>
                  ))}
                </ul>
              ) : (
                <div className="pc-muted">暂无详细数据</div>
              )}

              {buy ? (
                <a className="pc-buyTag" href={buy} target="_blank" rel="noreferrer">
                  购买
                </a>
              ) : null}
            </div>
        </div>
      </div>
    </article>
  );
}