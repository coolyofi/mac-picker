import { useEffect, useRef, useState, useMemo } from "react";

/**
 * 搜索框 + 下拉提示组件
 * - 实时下拉提示
 */
export default function SearchWithDropdown({ 
  value = "",
  onChange,
  products, 
  placeholder = "搜索…" 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // 同步外部value
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // 生成提示列表（从产品数据提取）
  const suggestions = useMemo(() => {
    if (!inputValue || inputValue.length < 1) return [];
    
    const query = inputValue.toLowerCase();
    const seen = new Set();
    const results = [];

    // 匹配产品数据
    for (const item of products) {
      const candidates = [
        item?.displayTitle,
        item?.modelId,
        item?.specs?.chip_model,
        item?.specs?.chip_series,
        item?.color,
      ].filter(Boolean);

      for (const candidate of candidates) {
        const candidateStr = String(candidate).toLowerCase();
        if (candidateStr.includes(query) && !seen.has(candidateStr)) {
          seen.add(candidateStr);
          results.push({
            text: String(candidate),
            type: "product",
            itemId: item?.id
          });
        }
      }

      if (results.length >= 10) break;
    }

    return results;
  }, [inputValue, products]);

  // 处理输入变化
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    onChange(val);
    setIsOpen(val.length > 0 && suggestions.length > 0);
    setHighlightIdx(-1);
  };

  // 处理键盘事件
  const handleKeyDown = (e) => {
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
            const selected = suggestions[highlightIdx];
            setInputValue(selected.text);
            onChange(selected.text);
            setIsOpen(false);
          }
          break;
        case "Escape":
          setIsOpen(false);
          setHighlightIdx(-1);
          break;
      }
    }
  };

  // 处理建议点击
  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion.text);
    onChange(suggestion.text);
    setIsOpen(false);
  };

  // 清空
  const handleClear = () => {
    setInputValue("");
    onChange("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // 点击外部关闭下拉
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        inputRef.current &&
        !inputRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="swd-wrapper">
      <div className="swd-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          className="swd-input"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => inputValue && suggestions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          inputMode="search"
          autoComplete="off"
        />

        {/* 清空按钮 */}
        {inputValue && (
          <button
            className="swd-clear"
            onClick={handleClear}
            aria-label="清空搜索"
            type="button"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        )}
      </div>

      {/* 下拉提示 */}
      {isOpen && suggestions.length > 0 && (
        <div className="swd-dropdown" ref={dropdownRef}>
          {suggestions.map((suggestion, idx) => (
            <div
              key={`${suggestion.text}-${idx}`}
              className={`swd-item ${idx === highlightIdx ? "swd-item--active" : ""}`}
              onClick={() => handleSuggestionClick(suggestion)}
              role="option"
              aria-selected={idx === highlightIdx}
            >
              <div className="swd-item-text">
                {suggestion.text}
              </div>
              {suggestion.type === "preset" && <span className="swd-item-type">预设</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
