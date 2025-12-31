import { useEffect, useState } from "react";

function ClientOnlyTime({ lastUpdated }) {
  const [relativeTime, setRelativeTime] = useState("加载中...");
  const [fullTime, setFullTime] = useState("");

  const formatRelativeTime = (dateStr) => {
    const date = new Date(dateStr);
    if (isNaN(date)) return "时间无效";

    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return "刚刚";
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    return date.toLocaleDateString("zh-CN");
  };

  useEffect(() => {
    const updateTimes = () => {
      if (lastUpdated) {
        const parsedDate = new Date(lastUpdated);
        if (!isNaN(parsedDate)) {
          setRelativeTime(formatRelativeTime(lastUpdated));
          setFullTime(parsedDate.toLocaleString("zh-CN"));
        } else {
          setRelativeTime("时间无效");
          setFullTime("未知");
        }
      } else {
        setRelativeTime("时间未知");
        setFullTime("未知");
      }
    };

    updateTimes();

    const interval = setInterval(updateTimes, 60000); // Update every minute

    return () => {
      clearInterval(interval);
    };
  }, [lastUpdated]);

  return (
    <span
      className="client-time"
      title={fullTime}
      style={{ fontFamily: "monospace", display: "inline-flex", alignItems: "center" }}
    >
      <span style={{ marginRight: "4px" }}></span>
      {relativeTime}
    </span>
  );
}

export default ClientOnlyTime;