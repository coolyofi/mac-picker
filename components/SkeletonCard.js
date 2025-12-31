export default function SkeletonCard() {
  return (
    <article className="pc pc--skeleton">
      <div className="pc-flip">
        <div className="pc-face pc-front">
          <div className="pc-top">
            <div className="pc-titleWrap">
              <div className="pc-title skeleton-line short" />
              <div className="pc-model skeleton-line thinner" />
            </div>

            <div className="pc-price skeleton-line small" />
          </div>

          <div className="pc-sep" />

          <div className="pc-imgContainer">
            <div className="pc-img">
              <div className="skeleton-rect" />
            </div>

            <div className="pc-tagsOverlay">
              <div className="pc-tagRow">
                <span className="pc-tag skeleton-line tiny" />
                <span className="pc-tag skeleton-line tiny" />
                <span className="pc-tag skeleton-line tiny" />
              </div>
              <div className="pc-tagRow">
                <span className="pc-tag skeleton-line tiny" />
                <span className="pc-tag skeleton-line tiny" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
