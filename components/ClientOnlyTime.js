import { useEffect, useState } from "react";

function ClientOnlyTime({ lastUpdated }) {
  const [formattedTime, setFormattedTime] = useState("");

  useEffect(() => {
    if (lastUpdated) {
      setFormattedTime(new Date(lastUpdated).toLocaleString("zh-CN"));
    } else {
      setFormattedTime("未知");
    }
  }, [lastUpdated]);

  return <span>{formattedTime}</span>;
}

export default ClientOnlyTime;