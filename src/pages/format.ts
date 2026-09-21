import type { LedgerAction } from "../domain/types";

// ============ 页面展示辅助 ============

export function fmtTime(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

export const ACTION_META: Record<LedgerAction, { label: string; className: string }> = {
  issue: { label: "领用", className: "tag-issue" },
  remove: { label: "拆旧", className: "tag-remove" },
  install: { label: "装新", className: "tag-install" },
  return: { label: "回收", className: "tag-return" },
  handover: { label: "交接", className: "tag-handover" },
};
