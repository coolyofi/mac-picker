import { useState, useEffect } from "react";

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
              <div className="pc-title">{title}</div>
              {modelId ? <div className="pc-model">{modelId}</div> : null}
            </div>

            <div className="pc-price">{fmtPrice(data?.priceNum)}</div>
          </div>

          <div className="pc-sep" />

          {/* tags */}
          <div className="pc-tags">
            <div className="pc-tagRow">
              {cpu !== null ? <span className="pc-tag pc-tag--cpu">CPU {cpu}</span> : null}
              {gpu !== null ? <span className="pc-tag pc-tag--gpu">GPU {gpu}</span> : null}
            </div>

            <div className="pc-tagRow">
              {ram !== null ? <span className="pc-tag pc-tag--ram">RAM {ram}GB</span> : null}
              {ssd !== null ? <span className="pc-tag pc-tag--ssd">SSD {ssd}GB</span> : null}
            </div>

            <div className="pc-tagRow pc-tagRow--minor">
              {xdr ? <span className="pc-chip pc-chip--xdr">XDR 显示屏</span> : null}
              {tenge ? <span className="pc-chip pc-chip--10ge">10GE</span> : null}
              {color ? <span className="pc-chip pc-chip--color">{color}</span> : null}
            </div>
          </div>

          <div className="pc-sep" />

          {/* image */}
          <div className="pc-img" onClick={(e) => { e.stopPropagation(); if (buy) window.open(buy, "_blank"); }}>
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

          <div className="pc-flipHint">点击查看详情</div>
        </div>

        {/* Back */}
        <div className="pc-face pc-back">
          <div className="pc-backContent">
            <h3 className="pc-backTitle">{title}</h3>
            {modelId ? <div className="pc-backModel">{modelId}</div> : null}

            <div className="pc-sep" />

            {details.length ? (
              <ul className="pc-list">
                {details
                  .filter(line => !line.includes("– FGND3CH/A") && !line.includes("– G15S3CH/A"))
                  .map((line, idx) => (
                    <li key={`${modelId || title}-${idx}`}>{line}</li>
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