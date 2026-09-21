import { useEffect, useReducer, useState } from "react";
import {
  FILTER_KEY,
  STORAGE_KEY,
  loadFilters,
  loadState,
  reducer,
  saveFilters,
  saveState,
} from "./domain/store";
import type { FilterState } from "./domain/types";
import WorkbenchPage from "./pages/WorkbenchPage";
import { fmtTime } from "./pages/format";
import "./styles.css";

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);
  const [filters, setFilters] = useState<FilterState>(loadFilters);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  // 浏览器存档：状态与筛选每次变更即写入 localStorage，刷新保留
  useEffect(() => {
    saveState(state);
    setSavedAt(fmtTime(new Date().toISOString()));
  }, [state]);
  useEffect(() => saveFilters(filters), [filters]);

  // 跨标签页同步：其他标签页写入存档后，本页实时跟进
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          dispatch({ type: "sync", state: JSON.parse(e.newValue) });
        } catch {
          // 忽略无法解析的存档
        }
      }
      if (e.key === FILTER_KEY && e.newValue) {
        try {
          setFilters(JSON.parse(e.newValue));
        } catch {
          // 同上
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <WorkbenchPage
      state={state}
      dispatch={dispatch}
      filters={filters}
      onFiltersChange={setFilters}
      savedAt={savedAt}
    />
  );
}
