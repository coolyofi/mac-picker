import { useEffect, useRef, useState, useMemo } from "react";

/**
 * 搜索框 + 实时下拉提示组件
 * - 输入 1 个字符开始提示
 * - 模糊匹配 + 忽略大小写
 * - 支持一键清空
 */
export default function SearchWithDropdown({ value, onChange, products, placeholder = "搜索…" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // 生成提示列表（从 displayTitle、modelId、chip_model、chip_series 提取）
  const suggestions = useMemo(() => {
    if (!value || value.length < 1) return [];
    
    const query = value.toLowerCase();
    const seen = new Set();
    const results = [];

    for (const item of products) {
      // 构建搜索候选项
      const candidates = [
        item?.displayTitle,
        item?.modelId,
        item?.specs?.chip_model,
        item?.specs?.chip_series,
        item?.color,
      ].filter(Boolean);

      for (const candidate of candidates) {
        const candidateStr = String(candidate).toLowerCase();
        // 模糊匹配：检查是否包含查询字符串
        if (candidateStr.includes(query) && !seen.has(candidateStr)) {
          seen.add(candidateStr);
          results.push({
            text: String(candidate),
            itemId: item?.id,
            modelId: item?.modelId,
            price: item?.priceNum,
          });
        }
      }

      // 限制结果数量
      if (results.length >= 8) break;
    }

    return results;
  }, [value, products]);

  // 处理键盘导航
  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightIdx((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightIdx((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightIdx >= 0 && highlightIdx < suggestions.length) {
          const selected = suggestions[highlightIdx];
          onChange(selected.text);
          setIsOpen(false);
          setHighlightIdx(-1);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setHighlightIdx(-1);
        break;
      default:
        break;
    }
  };

  // 处理输入框变化
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(newValue.length > 0 && suggestions.length > 0);
    setHighlightIdx(-1);
  };

  // 处理一键清空
  const handleClear = () => {
    onChange("");
    setIsOpen(false);
    setHighlightIdx(-1);
    inputRef.current?.focus();
  };

  // 处理建议点击
  const handleSuggestionClick = (suggestion) => {
    onChange(suggestion.text);
    setIsOpen(false);
    setHighlightIdx(-1);
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
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => value && suggestions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          inputMode="search"
          autoComplete="off"
        />
        {/* 清空按钮 */}
        {value && (
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
              key={`${suggestion.itemId}-${suggestion.text}`}
              className={`swd-item ${idx === highlightIdx ? "swd-item--active" : ""}`}
              onClick={() => handleSuggestionClick(suggestion)}
              role="option"
              aria-selected={idx === highlightIdx}
            >
              <div className="swd-item-text">{suggestion.text}</div>
              {suggestion.price && (
                <div className="swd-item-price">¥{suggestion.price}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
