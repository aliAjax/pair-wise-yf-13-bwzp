import { useEffect, useState } from "react";

/** 与浏览器存档同步的 UI 状态：刷新后保留 */
export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) return { ...initial, ...(JSON.parse(raw) as T) };
    } catch {
      /* 忽略损坏的存档 */
    }
    return initial;
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* 存储不可用时静默跳过 */
    }
  }, [key, value]);
  return [value, setValue] as const;
}
