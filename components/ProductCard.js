import { useMemo } from "react";
import { motion } from "framer-motion";

function formatPrice(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return "—";
  // 取消 .00：这里直接用整数 + 千分位
  return `¥${Math.round(num).toLocaleString("zh-CN")}`;
}

function formatGB(val) {
  const n = Number(val);
  if (!Number.isFinite(n) || n <= 0) return "—";
  return n >= 1024 ? `${(n / 1024).toFixed(n % 1024 === 0 ? 0 : 1)}TB` : `${n}GB`;
}

function pickTitle(data) {
  // 你数据层已规范化 title（机型全称 - 芯片），这里尽量直接用
  return data?.title || data?.name || "Mac Configuration";
}

export default function ProductCard({ data }) {
  const s = data?.specs || {};

  const title = pickTitle(data);
  const model = data?.model || data?.sku || data?.id || "";

  const price = formatPrice(data?.priceNum ?? data?.price);

  const ram = Number(s?.ram || 0);
  const ssd = Number(s?.ssd_gb || 0);
  const cpu = Number(s?.cpu_cores || 0);
  const gpu = Number(s?.gpu_cores || 0);

  const has10GbE = Boolean(s?.has10GbE);

  const tags = useMemo(() => {
    const out = [];
    if (ram) out.push({ k: "ram", label: `${ram}GB RAM` });
    if (ssd) out.push({ k: "ssd", label: `${formatGB(ssd)} SSD` });
    if (has10GbE) out.push({ k: "muted", label: "10GbE" });
    return out.slice(0, 3);
  }, [ram, ssd, has10GbE]);

  const details = Array.isArray(data?.details) ? data.details : [];

  return (
    <motion.article
      className="card glass"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.12 }}
    >
      {/* Price + Live */}
      <div className="card__top">
        <div className="live">
          <span className="live__dot" aria-hidden="true" />
          <span className="live__text">LIVE</span>
        </div>

        <div className="price">{price}</div>
      </div>

      {/* Title */}
      <div className="card__head">
        <div className="card__series">
          {(s?.chip_series || "M") + " SERIES"}
        </div>
        <div className="card__title" title={title}>
          {title}
        </div>
        {model ? (
          <div className="card__model" title={model}>
            {model}
          </div>
        ) : null}
      </div>

      {/* Tags */}
      <div className="card__tags">
        {tags.map((t, idx) => (
          <span key={`${t.k}-${idx}`} className={`tag tag--${t.k}`}>
            {t.label}
          </span>
        ))}
      </div>

      {/* Stats (轻量矩阵，不做花哨图) */}
      <div className="card__stats">
        <div className="stat">
          <div className="stat__k">CPU</div>
          <div className="stat__v">{cpu ? `${cpu}` : "—"}</div>
        </div>
        <div className="stat">
          <div className="stat__k">GPU</div>
          <div className="stat__v">{gpu ? `${gpu}` : "—"}</div>
        </div>
        <div className="stat">
          <div className="stat__k">DISPLAY</div>
          <div className="stat__v">{s?.screen_in ? `${s.screen_in}"` : "—"}</div>
        </div>
      </div>

      {/* Expand */}
      <details className="card__details">
        <summary className="card__summary">FULL SPECS</summary>
        <div className="card__specs">
          {details.length ? (
            details.slice(0, 10).map((line, i) => (
              <div key={i} className="specLine">
                {String(line)}
              </div>
            ))
          ) : (
            <div className="specLine specLine--muted">No additional specs.</div>
          )}
        </div>
      </details>

      <style jsx>{`
        .card{
          border:1px solid rgba(255,255,255,.10);
          border-radius: var(--radius);
          background: rgba(255,255,255,.03);
          padding: 14px 14px 12px 14px;
          box-shadow: var(--shadow);
          position:relative;
          overflow:hidden;
          display:flex;
          flex-direction:column;
          gap:10px;
        }

        .glass{
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }

        .card::after{
          content:"";
          position:absolute;
          inset:-40% -20% auto -20%;
          height: 90px;
          background: radial-gradient(closest-side, rgba(47,125,255,.25), transparent 70%);
          opacity:.65;
          pointer-events:none;
        }

        .card__top{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:10px;
        }

        .live{
          display:flex;
          align-items:center;
          gap:8px;
        }
        .live__dot{
          width:7px;
          height:7px;
          border-radius:999px;
          background: var(--blue);
          box-shadow: 0 0 0 4px rgba(47,125,255,.12), 0 0 18px rgba(47,125,255,.55);
          animation: breathe 1.6s ease-in-out infinite;
        }
        @keyframes breathe{
          0%{ transform: scale(1); opacity:.8; }
          55%{ transform: scale(1.12); opacity:1; }
          100%{ transform: scale(1); opacity:.8; }
        }
        .live__text{
          font-size:10px;
          letter-spacing:.18em;
          text-transform:uppercase;
          color: rgba(255,255,255,.72);
          font-weight:900;
        }

        .price{
          font-size: 18px;
          font-weight: 950;
          letter-spacing: -.02em;
          background: linear-gradient(135deg, #2f7dff, #7ab8ff);
          -webkit-background-clip:text;
          background-clip:text;
          color: transparent;
          font-variant-numeric: tabular-nums;
        }

        .card__head{
          display:flex;
          flex-direction:column;
          gap:6px;
          margin-top: 2px;
        }
        .card__series{
          font-family: var(--mono);
          font-size:10px;
          letter-spacing:.18em;
          text-transform:uppercase;
          color: rgba(47,125,255,.85);
        }
        .card__title{
          font-size: 13px;
          font-weight: 950;
          letter-spacing: -.01em;
          line-height: 1.25;
          display:-webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow:hidden;
        }
        .card__model{
          font-family: var(--mono);
          font-size: 10px;
          color: rgba(255,255,255,.45);
          overflow:hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .card__tags{
          display:flex;
          gap:8px;
          flex-wrap:wrap;
        }
        .tag{
          font-size: 10px;
          font-weight: 900;
          letter-spacing:.08em;
          text-transform:uppercase;
          padding: 6px 10px;
          border-radius:999px;
          border:1px solid rgba(255,255,255,.12);
          background: rgba(0,0,0,.25);
          color: rgba(255,255,255,.78);
        }
        .tag--ram{
          border-color: rgba(0,242,255,.35);
          color: var(--cyan);
          box-shadow: 0 0 18px rgba(0,242,255,.12);
        }
        .tag--ssd{
          border-color: rgba(57,255,20,.35);
          color: var(--green);
          box-shadow: 0 0 18px rgba(57,255,20,.10);
        }
        .tag--muted{
          color: rgba(255,255,255,.70);
        }

        .card__stats{
          margin-top: 2px;
          display:grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap:10px;
        }
        .stat{
          border:1px solid rgba(255,255,255,.06);
          background: rgba(255,255,255,.02);
          border-radius: 14px;
          padding: 9px 10px;
          display:flex;
          align-items:baseline;
          justify-content:space-between;
        }
        .stat__k{
          font-size:10px;
          letter-spacing:.18em;
          text-transform:uppercase;
          color: rgba(255,255,255,.38);
          font-weight:900;
        }
        .stat__v{
          font-family: var(--mono);
          font-size: 11px;
          font-weight: 900;
          color: rgba(255,255,255,.86);
          font-variant-numeric: tabular-nums;
        }

        .card__details{
          margin-top: auto;
          border-top: 1px solid rgba(255,255,255,.06);
          padding-top: 10px;
        }
        .card__summary{
          cursor:pointer;
          list-style:none;
          font-size: 11px;
          font-weight: 950;
          letter-spacing:.14em;
          text-transform:uppercase;
          color: rgba(255,255,255,.72);
          display:flex;
          align-items:center;
          justify-content:space-between;
          user-select:none;
        }
        .card__summary::-webkit-details-marker{ display:none; }
        .card__summary::after{
          content:"▾";
          color: rgba(255,255,255,.40);
          transform: translateY(-1px);
        }
        details[open] .card__summary::after{ content:"▴"; }

        .card__specs{
          margin-top: 10px;
          display:flex;
          flex-direction:column;
          gap:6px;
        }
        .specLine{
          font-size: 12px;
          color: rgba(255,255,255,.62);
          line-height: 1.35;
        }
        .specLine--muted{
          color: rgba(255,255,255,.38);
        }
      `}</style>
    </motion.article>
  );
}