import { useEffect, useRef, useState, useMemo } from "react";

/**
 * SearchWithDropdown - Advanced Search Component
 * Supports:
 * - Text input (live search via query)
 * - Tag management (add/remove tags)
 * - Logic toggle (AND/OR)
 * - Autocomplete suggestions
 */
export default function SearchWithDropdown({ 
  query = "",
  onQueryChange,
  tags = [],
  onTagsChange,
  logic = "AND",
  onLogicChange,
  products = [], 
  placeholder = "搜索…" 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const containerRef = useRef(null);

  // Generate suggestions based on query
  const suggestions = useMemo(() => {
    if (!query || query.length < 1) return [];
    
    const q = query.toLowerCase();
    const seen = new Set();
    const results = [];

    // Helper to add result
    const addResult = (text, category, type = "product") => {
      const key = `${category}:${text}`.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        results.push({ text, category, type });
      }
    };

    // 1. Check for category prefixes (e.g. "M1", "16GB")
    // This is a simplified heuristic. Real app might use a trie or index.
    
    for (const item of products) {
      if (results.length >= 10) break;

      // Chip
      if (item?.specs?.chip_model?.toLowerCase().includes(q)) {
        addResult(item.specs.chip_model, "芯片");
      }
      // Model
      if (item?.displayTitle?.toLowerCase().includes(q)) {
        addResult(item.displayTitle, "机型");
      }
      // Color
      if (item?.color?.toLowerCase().includes(q)) {
        addResult(item.color, "颜色");
      }
      // RAM
      if (String(item?.specs?.ram).includes(q)) {
        addResult(`${item.specs.ram}GB`, "内存");
      }
      // SSD
      if (String(item?.specs?.ssd_gb).includes(q)) {
        addResult(`${item.specs.ssd_gb}GB`, "存储");
      }
    }

    return results;
  }, [query, products]);

  // Handle input change
  const handleInputChange = (e) => {
    const val = e.target.value;
    onQueryChange(val);
    setIsOpen(val.length > 0);
    setHighlightIdx(-1);
  };

  // Add a tag
  const addTag = (tag) => {
    // Avoid duplicates
    if (tags.some(t => t.text === tag.text && t.category === tag.category)) {
      onQueryChange(""); // Just clear input
      return;
    }
    onTagsChange([...tags, tag]);
    onQueryChange("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // Remove a tag
  const removeTag = (index) => {
    const newTags = [...tags];
    newTags.splice(index, 1);
    onTagsChange(newTags);
  };

  // Handle keyboard
  const handleKeyDown = (e) => {
    if (e.key === "Backspace" && query === "" && tags.length > 0) {
      removeTag(tags.length - 1);
      return;
    }

    if (isOpen && suggestions.length > 0) {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightIdx((prev) => prev < suggestions.length - 1 ? prev + 1 : 0);
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightIdx((prev) => prev > 0 ? prev - 1 : suggestions.length - 1);
          break;
        case "Enter":
          e.preventDefault();
          if (highlightIdx >= 0) {
            addTag(suggestions[highlightIdx]);
          } else if (query.trim()) {
            // Add as generic keyword tag
            addTag({ text: query.trim(), category: "关键字" });
          }
          break;
        case "Escape":
          setIsOpen(false);
          break;
      }
    } else if (e.key === "Enter" && query.trim()) {
      e.preventDefault();
      addTag({ text: query.trim(), category: "关键字" });
    }
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="swd-container" ref={containerRef}>
      <div className="swd-input-box" onClick={() => inputRef.current?.focus()}>
        {/* Logic Toggle */}
        {tags.length > 1 && (
          <button 
            className="swd-logic-btn"
            onClick={(e) => {
              e.stopPropagation();
              onLogicChange(logic === "AND" ? "OR" : "AND");
            }}
            title="切换匹配逻辑"
          >
            {logic}
          </button>
        )}

        {/* Tags */}
        {tags.map((tag, idx) => (
          <div key={`${tag.category}-${tag.text}-${idx}`} className="swd-tag">
            <span className="swd-tag-cat">{tag.category}:</span>
            <span className="swd-tag-text">{tag.text}</span>
            <button 
              className="swd-tag-remove"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(idx);
              }}
            >
              ×
            </button>
          </div>
        ))}

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          className="swd-input"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query && suggestions.length > 0 && setIsOpen(true)}
          placeholder={tags.length === 0 ? placeholder : ""}
          autoComplete="off"
        />

        {/* Clear Button (only if query exists) */}
        {query && (
          <button
            className="swd-clear-btn"
            onClick={(e) => {
              e.stopPropagation();
              onQueryChange("");
              inputRef.current?.focus();
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="swd-dropdown" ref={dropdownRef}>
          {suggestions.map((s, idx) => (
            <div
              key={`${s.category}-${s.text}-${idx}`}
              className={`swd-item ${idx === highlightIdx ? "active" : ""}`}
              onClick={() => addTag(s)}
              onMouseEnter={() => setHighlightIdx(idx)}
            >
              <span className="swd-item-text">{s.text}</span>
              <span className="swd-item-cat">{s.category}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
