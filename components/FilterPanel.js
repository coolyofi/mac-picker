import GeekSlider from "./GeekSlider";

export default function FilterPanel({ filters, setFilters, screenSizes }) {
  return (
    <div className="fp">
      {/* RAM */}
      <section className="fp__section">
        <div className="fp__k">Unified Memory</div>
        <GeekSlider
          type="ram"
          value={filters.ram}
          onChange={(v) =>
            setFilters((f) => (f.ram === v ? f : { ...f, ram: v }))
          }
        />
        <div className="fp__hint fp__hint--ram">≥ {filters.ram} GB</div>
      </section>

      {/* SSD */}
      <section className="fp__section">
        <div className="fp__k">Storage</div>
        <GeekSlider
          type="ssd"
          value={filters.ssd}
          onChange={(v) =>
            setFilters((f) => (f.ssd === v ? f : { ...f, ssd: v }))
          }
        />
        <div className="fp__hint fp__hint--ssd">≥ {filters.ssd} GB</div>
      </section>

      {/* Chip */}
      <section className="fp__section">
        <div className="fp__k">Chip Series</div>
        <div className="btnRow">
          {["all", "M1", "M2", "M3", "M4"].map((series) => (
            <button
              key={series}
              type="button"
              className={`btn ${filters.chipSeries === series ? "isActive" : ""}`}
              onClick={() =>
                setFilters((f) =>
                  f.chipSeries === series ? f : { ...f, chipSeries: series }
                )
              }
            >
              {series === "all" ? "ALL" : series}
            </button>
          ))}
        </div>
      </section>

      {/* Screen */}
      {Array.isArray(screenSizes) && screenSizes.length > 0 ? (
        <section className="fp__section">
          <div className="fp__k">Display</div>
          <div className="btnRow">
            <button
              type="button"
              className={`btn ${filters.screenIn === "all" ? "isActive" : ""}`}
              onClick={() =>
                setFilters((f) => (f.screenIn === "all" ? f : { ...f, screenIn: "all" }))
              }
            >
              ALL
            </button>

            {screenSizes.slice(0, 8).map((size) => (
              <button
                key={size}
                type="button"
                className={`btn ${Number(filters.screenIn) === size ? "isActive" : ""}`}
                onClick={() =>
                  setFilters((f) => (f.screenIn === size ? f : { ...f, screenIn: size }))
                }
              >
                {size}&quot;
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {/* 10GbE */}
      <section className="fp__section">
        <div className="fp__k">Network</div>
        <button
          type="button"
          className={`toggle ${filters.has10GbE ? "isOn" : ""}`}
          onClick={() => setFilters((f) => ({ ...f, has10GbE: !f.has10GbE }))}
        >
          <span className="toggle__k">10Gb Ethernet</span>
          <span className="toggle__v">{filters.has10GbE ? "ON" : "OFF"}</span>
        </button>
      </section>
    </div>
  );
}