
// Worker for filtering and sorting products
// This moves heavy computation off the main thread

self.onmessage = (e) => {
  const { products, filters } = e.data;

  if (!products || !Array.isArray(products)) {
    self.postMessage([]);
    return;
  }

  const { q, priceMin, priceMax, ram, ssd, tags, logic } = filters;
  const normalizedQuery = (q || "").trim().toLowerCase();
  const minP = Number(priceMin || 0);
  const maxP = Number(priceMax || 0);
  const ramMin = Number(ram || 0);
  const ssdMin = Number(ssd || 0);

  // Helper for tag matching
  const matchesTag = (item, tag) => {
    const s = item?.specs || {};
    const category = tag.category;
    const text = tag.text.toLowerCase();

    switch (category) {
      case "机型":
        return item?.displayTitle?.toLowerCase().includes(text) ||
               item?.modelId?.toLowerCase().includes(text);
      case "芯片":
        return s?.chip_model?.toLowerCase().includes(text) ||
               s?.chip_series?.toLowerCase().includes(text);
      case "存储":
        return String(s?.ssd_gb || "").includes(text.replace(/gb/i, "")) ||
               item?.details?.some(d => d.toLowerCase().includes(text));
      case "内存":
        return String(s?.ram || "").includes(text.replace(/gb/i, "")) ||
               item?.details?.some(d => d.toLowerCase().includes(text));
      case "颜色":
        return item?.color?.toLowerCase().includes(text);
      default:
        const haystack = [
          item?.displayTitle,
          item?.modelId,
          s?.chip_model,
          s?.chip_series,
          item?.color,
          ...(Array.isArray(item?.details) ? item.details : []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(text);
    }
  };

  const filtered = products.filter((item) => {
    const s = item?.specs || {};
    const price = Number(item?.priceNum || 0);

    // Price filter
    if (minP && price < minP) return false;
    if (maxP && price > maxP) return false;
    
    // Specs filter
    if (Number(s?.ram || 0) < ramMin) return false;
    if (Number(s?.ssd_gb || 0) < ssdMin) return false;

    // Tags filter
    if (tags && tags.length > 0) {
      const matches = tags.map(tag => matchesTag(item, tag));
      if (logic === "AND") {
        if (!matches.every(Boolean)) return false;
      } else {
        if (!matches.some(Boolean)) return false;
      }
    }

    // Text search
    if (normalizedQuery) {
      const haystack = [
        item?.displayTitle,
        item?.modelId,
        s?.chip_model,
        s?.chip_series,
        item?.color,
        ...(Array.isArray(item?.details) ? item.details : []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(normalizedQuery)) return false;
    }

    return true;
  });

  // Sort by price
  filtered.sort((a, b) => Number(a?.priceNum || 0) - Number(b?.priceNum || 0));

  self.postMessage(filtered);
};
