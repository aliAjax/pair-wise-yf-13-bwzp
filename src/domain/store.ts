import { nextShift, seedState } from "./seed";
import { checkHandover, checkInstall, checkIssue, checkRemoval, checkReturn } from "./rules";
import type {
  AppState,
  ExceptionEvent,
  FilterState,
  HandoverRecord,
  LedgerEntry,
  ReplacementCycle,
} from "./types";

// ============ 状态仓库：先校验后落账，整次拒绝时库存与设备状态不变 ============

export const STORAGE_KEY = "hxyfront-62001.spare-parts-station.state.v1";
export const FILTER_KEY = "hxyfront-62001.spare-parts-station.filters.v1";

export type Action =
  | { type: "issue"; deviceId: string; partId: string; qty: number }
  | { type: "remove"; deviceId: string }
  | { type: "install"; deviceId: string }
  | { type: "return"; deviceId: string }
  | { type: "handover"; operator: string; note: string }
  | { type: "reset" }
  | { type: "sync"; state: AppState };

const nowIso = () => new Date().toISOString();
const pad = (n: number, w: number) => String(n).padStart(w, "0");

/** 校验拒绝：只追加异常时间线，库存与设备状态原样保留 */
function reject(
  state: AppState,
  deviceId: string | null,
  deviceName: string,
  check: { rule: string; message: string }
): AppState {
  const seq = state.seq + 1;
  const event: ExceptionEvent = {
    id: `EX-${pad(seq, 4)}`,
    at: nowIso(),
    shift: state.currentShift,
    deviceId,
    deviceName,
    rule: check.rule,
    message: check.message,
  };
  return { ...state, seq, exceptions: [event, ...state.exceptions] };
}

function pushLedger(state: AppState, seq: number, entry: Omit<LedgerEntry, "id" | "at" | "shift">, at: string): LedgerEntry[] {
  return [{ id: `LG-${pad(seq, 4)}`, at, shift: state.currentShift, ...entry }, ...state.ledger];
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "issue": {
      const check = checkIssue(state, action.deviceId, action.partId, action.qty);
      const device = state.devices.find((d) => d.id === action.deviceId);
      const part = state.parts.find((p) => p.id === action.partId);
      if (!check.ok) return reject(state, device?.id ?? null, device?.name ?? "—", check);
      if (!device || !part) return state;

      const seq = state.seq + 1;
      const at = nowIso();
      const cycle: ReplacementCycle = {
        id: `CYC-${pad(seq, 4)}`,
        shift: state.currentShift,
        deviceId: device.id,
        partId: part.id,
        partName: part.name,
        qty: action.qty,
        issuedAt: at,
        removedAt: null,
        installedAt: null,
        returnedAt: null,
        receiptNo: null,
      };
      return {
        ...state,
        seq,
        parts: state.parts.map((p) => (p.id === part.id ? { ...p, stock: p.stock - action.qty } : p)),
        devices: state.devices.map((d) =>
          d.id === device.id ? { ...d, status: "locked", cycle } : d
        ),
        ledger: pushLedger(state, seq, {
          deviceId: device.id,
          deviceName: device.name,
          action: "issue",
          detail: `领用「${part.name}」×${action.qty} ${part.unit}，设备转入更换中（只读）`,
        }, at),
      };
    }

    case "remove": {
      const check = checkRemoval(state, action.deviceId);
      const device = state.devices.find((d) => d.id === action.deviceId);
      if (!check.ok) return reject(state, device?.id ?? null, device?.name ?? "—", check);
      if (!device || !device.cycle) return state;

      const seq = state.seq + 1;
      const at = nowIso();
      const cycle = device.cycle;
      return {
        ...state,
        seq,
        devices: state.devices.map((d) =>
          d.id === device.id ? { ...d, cycle: { ...cycle, removedAt: at } } : d
        ),
        ledger: pushLedger(state, seq, {
          deviceId: device.id,
          deviceName: device.name,
          action: "remove",
          detail: `拆下旧件（原位「${cycle.partName}」），待安装新件`,
        }, at),
      };
    }

    case "install": {
      const check = checkInstall(state, action.deviceId);
      const device = state.devices.find((d) => d.id === action.deviceId);
      if (!check.ok) return reject(state, device?.id ?? null, device?.name ?? "—", check);
      if (!device || !device.cycle) return state;

      const seq = state.seq + 1;
      const at = nowIso();
      const cycle = device.cycle;
      return {
        ...state,
        seq,
        devices: state.devices.map((d) =>
          d.id === device.id ? { ...d, cycle: { ...cycle, installedAt: at } } : d
        ),
        ledger: pushLedger(state, seq, {
          deviceId: device.id,
          deviceName: device.name,
          action: "install",
          detail: `安装新件「${cycle.partName}」×${cycle.qty}，待旧件回收入库`,
        }, at),
      };
    }

    case "return": {
      const check = checkReturn(state, action.deviceId);
      const device = state.devices.find((d) => d.id === action.deviceId);
      if (!check.ok) return reject(state, device?.id ?? null, device?.name ?? "—", check);
      if (!device || !device.cycle) return state;

      const seq = state.seq + 1;
      const at = nowIso();
      const cycle = device.cycle;
      const receiptNo = `RK-${at.slice(0, 10).replace(/-/g, "")}-${pad(seq, 3)}`;
      return {
        ...state,
        seq,
        devices: state.devices.map((d) =>
          d.id === device.id
            ? { ...d, status: "normal", cycle: null, lastReceipt: receiptNo }
            : d
        ),
        ledger: pushLedger(state, seq, {
          deviceId: device.id,
          deviceName: device.name,
          action: "return",
          detail: `旧件「${cycle.partName}」回收入库，入库回执 ${receiptNo}，设备解除只读`,
        }, at),
      };
    }

    case "handover": {
      const check = checkHandover(state);
      if (!check.ok) return reject(state, null, "—", check);

      const seq = state.seq + 1;
      const at = nowIso();
      const shiftLedger = state.ledger.filter((e) => e.shift === state.currentShift);
      const record: HandoverRecord = {
        id: `HO-${pad(seq, 4)}`,
        shift: state.currentShift,
        at,
        operator: action.operator.trim() || "当班轮机员",
        note: action.note.trim(),
        issueCount: shiftLedger.filter((e) => e.action === "issue").length,
        returnCount: shiftLedger.filter((e) => e.action === "return").length,
        exceptionCount: state.exceptions.filter((e) => e.shift === state.currentShift).length,
      };
      const next = nextShift(state.currentShift);
      return {
        ...state,
        seq,
        currentShift: next,
        handovers: [record, ...state.handovers],
        ledger: pushLedger(state, seq, {
          deviceId: null,
          deviceName: "—",
          action: "handover",
          detail: `${state.currentShift}班交接完成，转入 ${next}班${record.note ? `：${record.note}` : ""}`,
        }, at),
      };
    }

    case "reset":
      return seedState();

    case "sync":
      return action.state;

    default:
      return state;
  }
}

// ============ 浏览器存档：读写与跨标签页同步 ============

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedState();
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed || !Array.isArray(parsed.parts) || !Array.isArray(parsed.devices)) {
      return seedState();
    }
    return parsed;
  } catch {
    return seedState();
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 存档不可用（如隐私模式）时静默降级，页面仍可操作
  }
}

export const defaultFilters: FilterState = { deviceId: "all", shift: "all" };

export function loadFilters(): FilterState {
  try {
    const raw = localStorage.getItem(FILTER_KEY);
    if (!raw) return defaultFilters;
    const parsed = JSON.parse(raw) as FilterState;
    return { ...defaultFilters, ...parsed };
  } catch {
    return defaultFilters;
  }
}

export function saveFilters(filters: FilterState): void {
  try {
    localStorage.setItem(FILTER_KEY, JSON.stringify(filters));
  } catch {
    // 同上，静默降级
  }
}
