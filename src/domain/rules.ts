import type { StationState } from "./types";

export interface ReplacementCommand {
  deviceId: string;
  partId: string;
  qty: number;
  removedOld: boolean;
  installedNew: boolean;
  operator: string;
  note: string;
}

export type ViolationCode =
  | "INVALID_QTY"
  | "PART_MISMATCH"
  | "STOCK_EXCEEDED"
  | "INSTALL_BEFORE_REMOVE"
  | "INCOMPLETE_STEPS"
  | "OLD_PART_NOT_RETURNED"
  | "TICKET_NOT_FOUND"
  | "RECEIPT_MISSING";

export interface Violation {
  code: ViolationCode;
  message: string;
}

export function deviceName(state: StationState, id: string | null): string {
  if (!id) return "—";
  return state.devices.find((d) => d.id === id)?.name ?? id;
}

export function partName(state: StationState, id: string | null): string {
  if (!id) return "—";
  return state.parts.find((p) => p.id === id)?.name ?? id;
}

/**
 * 更换登记校验：任一规则不通过即整次拒绝，
 * 原库存与设备状态保持不变。
 */
export function validateReplacement(state: StationState, cmd: ReplacementCommand): Violation[] {
  const violations: Violation[] = [];
  const device = state.devices.find((d) => d.id === cmd.deviceId);
  const part = state.parts.find((p) => p.id === cmd.partId);
  if (!device) violations.push({ code: "PART_MISMATCH", message: "所选设备不存在" });
  if (!part) violations.push({ code: "PART_MISMATCH", message: "所选备件不存在" });
  if (!device || !part) return violations;

  if (!Number.isInteger(cmd.qty) || cmd.qty < 1) {
    violations.push({ code: "INVALID_QTY", message: "领用数量须为不小于 1 的整数" });
  } else if (cmd.qty > part.stock) {
    violations.push({
      code: "STOCK_EXCEEDED",
      message: `领用数量超过库存：${part.name} 在库 ${part.stock} ${part.unit}，申领 ${cmd.qty} ${part.unit}`,
    });
  }

  if (!part.deviceIds.includes(device.id)) {
    violations.push({ code: "PART_MISMATCH", message: `${part.name} 不适配 ${device.name}，不得领用` });
  }

  if (cmd.installedNew && !cmd.removedOld) {
    violations.push({ code: "INSTALL_BEFORE_REMOVE", message: "同设备未拆先装：须先拆下旧件，再安装新件" });
  }
  if (!cmd.removedOld && !cmd.installedNew) {
    violations.push({ code: "INCOMPLETE_STEPS", message: "未登记拆下旧件与安装新件，领用不予出库" });
  }
  if (cmd.removedOld && !cmd.installedNew) {
    violations.push({ code: "INCOMPLETE_STEPS", message: "已拆下旧件但未安装新件，设备不得无机件挂账" });
  }

  if (device.status === "pending") {
    violations.push({
      code: "OLD_PART_NOT_RETURNED",
      message: `旧件未回收入库：${device.name} 挂账工单 ${device.activeTicketId} 未闭环，设备只读`,
    });
  }
  return violations;
}

/** 旧件回收入库校验：回执登记后工单闭环，设备解除只读 */
export function validateReceipt(state: StationState, ticketId: string, receiptNo: string): Violation[] {
  const ticket = state.tickets.find((t) => t.id === ticketId);
  if (!ticket || ticket.status !== "pending") {
    return [{ code: "TICKET_NOT_FOUND", message: "工单不存在或已闭环" }];
  }
  if (!receiptNo.trim()) {
    return [{ code: "RECEIPT_MISSING", message: "须填写备件入库回执号" }];
  }
  return [];
}

/** 交接班校验：本班仍有挂账设备不得完成交接 */
export function validateHandover(state: StationState): Violation[] {
  const pending = state.tickets.filter((t) => t.shift === state.currentShift && t.status === "pending");
  if (pending.length === 0) return [];
  const names = pending.map((t) => deviceName(state, t.deviceId)).join("、");
  return [
    {
      code: "OLD_PART_NOT_RETURNED",
      message: `本班仍有挂账设备（${names}），旧件未回收入库，不得完成交接`,
    },
  ];
}
