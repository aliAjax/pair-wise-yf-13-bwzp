import { buildInitialState, nextShift } from "../data/seed";
import { now } from "../utils";
import {
  deviceName,
  validateHandover,
  validateReceipt,
  validateReplacement,
  type ReplacementCommand,
  type Violation,
} from "./rules";
import type { StationState, TimelineEvent } from "./types";

export const STORAGE_KEY = "hxyfront-62001:spare-station:v1";

export type Action =
  | { type: "register"; cmd: ReplacementCommand }
  | { type: "receipt"; ticketId: string; receiptNo: string; operator: string }
  | { type: "handover"; operator: string; note: string }
  | { type: "reset" };

export function reduce(state: StationState, action: Action): StationState {
  switch (action.type) {
    case "register":
      return applyRegister(state, action.cmd);
    case "receipt":
      return applyReceipt(state, action.ticketId, action.receiptNo, action.operator);
    case "handover":
      return applyHandover(state, action.operator, action.note);
    case "reset":
      return buildInitialState();
    default:
      return state;
  }
}

function applyRegister(state: StationState, cmd: ReplacementCommand): StationState {
  let seq = state.seq;
  const nextId = (prefix: string) => `${prefix}-${String(seq++).padStart(4, "0")}`;

  const violations = validateReplacement(state, cmd);
  if (violations.length > 0) {
    // 整次拒绝：仅追加异常事件，原库存与设备状态不变
    return {
      ...state,
      seq,
      events: [
        makeException(state, nextId, cmd.deviceId, `登记被拒 · ${deviceName(state, cmd.deviceId)}`, violations),
        ...state.events,
      ],
    };
  }

  const part = state.parts.find((p) => p.id === cmd.partId)!;
  const device = state.devices.find((d) => d.id === cmd.deviceId)!;
  const ticket = {
    id: nextId("WO"),
    shift: state.currentShift,
    deviceId: cmd.deviceId,
    partId: cmd.partId,
    qty: cmd.qty,
    removedOld: cmd.removedOld,
    installedNew: cmd.installedNew,
    operator: cmd.operator,
    note: cmd.note,
    status: "pending" as const,
    createdAt: now(),
    receiptNo: null,
    closedAt: null,
  };
  const event: TimelineEvent = {
    id: nextId("EV"),
    at: now(),
    shift: state.currentShift,
    deviceId: device.id,
    kind: "register",
    title: `更换登记 · ${device.name}`,
    detail: `领用 ${part.name} ×${cmd.qty}，拆下旧件并安装新件；设备挂账只读，待旧件回收入库 · 经办 ${cmd.operator}`,
  };
  return {
    ...state,
    seq,
    parts: state.parts.map((p) => (p.id === part.id ? { ...p, stock: p.stock - cmd.qty } : p)),
    devices: state.devices.map((d) =>
      d.id === device.id
        ? { ...d, status: "pending", readOnly: true, activeTicketId: ticket.id, installedPart: `${part.name}（新装）` }
        : d
    ),
    tickets: [ticket, ...state.tickets],
    events: [event, ...state.events],
  };
}

function applyReceipt(state: StationState, ticketId: string, receiptNo: string, operator: string): StationState {
  let seq = state.seq;
  const nextId = (prefix: string) => `${prefix}-${String(seq++).padStart(4, "0")}`;

  const violations = validateReceipt(state, ticketId, receiptNo);
  if (violations.length > 0) {
    return { ...state, seq, events: [makeException(state, nextId, null, "入库回执被拒", violations), ...state.events] };
  }

  const ticket = state.tickets.find((t) => t.id === ticketId)!;
  const device = state.devices.find((d) => d.id === ticket.deviceId)!;
  const event: TimelineEvent = {
    id: nextId("EV"),
    at: now(),
    shift: state.currentShift,
    deviceId: device.id,
    kind: "receipt",
    title: `旧件回收入库 · ${device.name}`,
    detail: `回执号 ${receiptNo.trim()} · 工单 ${ticket.id} 闭环，${device.name} 解除只读 · 确认 ${operator}`,
  };
  return {
    ...state,
    seq,
    tickets: state.tickets.map((t) =>
      t.id === ticketId ? { ...t, status: "closed" as const, receiptNo: receiptNo.trim(), closedAt: now() } : t
    ),
    devices: state.devices.map((d) =>
      d.id === device.id ? { ...d, status: "normal", readOnly: false, activeTicketId: null } : d
    ),
    events: [event, ...state.events],
  };
}

function applyHandover(state: StationState, operator: string, note: string): StationState {
  let seq = state.seq;
  const nextId = (prefix: string) => `${prefix}-${String(seq++).padStart(4, "0")}`;

  const violations = validateHandover(state);
  if (violations.length > 0) {
    return {
      ...state,
      seq,
      events: [makeException(state, nextId, null, `交接被拒 · ${state.currentShift}`, violations), ...state.events],
    };
  }

  const to = nextShift(state.currentShift);
  const ticketCount = state.tickets.filter((t) => t.shift === state.currentShift).length;
  const record = {
    id: nextId("HO"),
    shift: state.currentShift,
    toShift: to,
    at: now(),
    operator,
    note,
    ticketCount,
  };
  const event: TimelineEvent = {
    id: nextId("EV"),
    at: now(),
    shift: state.currentShift,
    deviceId: null,
    kind: "handover",
    title: `交接完成 · ${state.currentShift} → ${to}`,
    detail: `本班登记 ${ticketCount} 单，全部闭环 · 交班 ${operator}${note ? ` · ${note}` : ""}`,
  };
  return {
    ...state,
    seq,
    currentShift: to,
    handovers: [record, ...state.handovers],
    events: [event, ...state.events],
  };
}

function makeException(
  state: StationState,
  nextId: (prefix: string) => string,
  deviceId: string | null,
  title: string,
  violations: Violation[]
): TimelineEvent {
  return {
    id: nextId("EV"),
    at: now(),
    shift: state.currentShift,
    deviceId,
    kind: "exception",
    title,
    detail: violations.map((v) => v.message).join("；"),
  };
}

export function loadState(): StationState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StationState;
      if (parsed && Array.isArray(parsed.parts) && Array.isArray(parsed.devices) && Array.isArray(parsed.events)) {
        return parsed;
      }
    }
  } catch {
    /* 存档损坏时回落到初始台账 */
  }
  return buildInitialState();
}

export function saveState(state: StationState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* 存储不可用时静默跳过 */
  }
}
