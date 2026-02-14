// Critical CSS for above-the-fold content
// This is inlined in the HTML head for performance
export const criticalCss = `/* Minimal critical CSS for above-the-fold */
html,body{height:100%;margin:0;padding:0;background:#000;color:rgba(255,255,255,.92);font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",Inter,system-ui,sans-serif}
.mp-root{min-height:100vh;position:relative}
.mp-bg-fixed{position:fixed;inset:0;pointer-events:none;z-index:-1}
.mp-topbar{max-width:1400px;margin:0 auto;padding:18px 28px;display:flex;align-items:center;justify-content:space-between;gap:12px}
.mp-brand{display:flex;flex-direction:column}
.mp-title{font-size:42px;font-weight:850;line-height:1;color:var(--txt)}
.mp-subtitle{font-size:14px;color:var(--muted)}
.mp-searchWrap{min-width:0}
.mp-search{width:100%;max-width:420px;height:40px;padding:0 14px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:rgba(0,0,0,.55);color:var(--txt)}
.mp-layout{max-width:1400px;margin:0 auto;padding:14px 28px 40px;display:grid;grid-template-columns:320px 1fr;gap:26px}
.mp-sidebar{position:relative;padding:18px;border-radius:16px;background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.08)}
.mp-main{padding-top:2px}
.mp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:22px}
.pc{border-radius:12px;border:1px solid rgba(255,255,255,.08);background:rgba(0,0,0,.6);padding:18px;display:flex;flex-direction:column;min-height:240px}
.pc-title{font-weight:800;font-size:16px}
.pc-price{font-weight:900;font-size:18px}
.pc-imgContainer{border-radius:12px;overflow:hidden;background:rgba(0,0,0,.15);border:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:center;height:160px}
.pc-tagsOverlay{position:absolute;left:0;right:0;bottom:0;padding:12px;display:flex;gap:6px}
/* Mobile tweaks */
@media (max-width:980px){.mp-layout{grid-template-columns:1fr}.mp-sidebar{display:none}.mp-search{width:100%}}
/* Reduce visual noise for fast paint */
.mp-bg-gradients,.mp-bg-grid,.mp-bg-particles{opacity:0.6;filter:none}`;
