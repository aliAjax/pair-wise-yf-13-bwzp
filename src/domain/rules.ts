import type { AppState, Device } from "./types";

// ============ 校验规则层：全部为纯函数，不修改状态 ============
// 规则不通过时，调用方整次拒绝：原库存与设备状态保持不变，仅登记异常时间线。

export const RULES = {
  STOCK_EXCEEDED: "库存校验 · 领用超量",
  OLD_PART_NOT_RETURNED: "回收校验 · 旧件未入库",
  INSTALL_BEFORE_REMOVE: "顺序校验 · 未拆先装",
  RETURN_BEFORE_INSTALL: "顺序校验 · 未装先收",
  NO_ACTIVE_CYCLE: "流程校验 · 无在修工单",
  STAGE_DONE: "流程校验 · 步骤重复",
  PENDING_DEVICES: "交接校验 · 挂账未清",
  DEVICE_MISSING: "数据校验 · 设备不存在",
  PART_MISSING: "数据校验 · 备件不存在",
  BAD_QTY: "数据校验 · 数量非法",
} as const;

export type RuleResult = { ok: true } | { ok: false; rule: string; message: string };

const PASS: RuleResult = { ok: true };
const fail = (rule: string, message: string): RuleResult => ({ ok: false, rule, message });

/** 设备当前更换周期所处阶段（用于提示与展示） */
export function cycleStage(device: Device): string {
  const c = device.cycle;
  if (!c) return "空闲";
  if (c.installedAt) return "新件已装 · 待旧件回收";
  if (c.removedAt) return "旧件已拆 · 待装新件";
  return "已领用 · 待拆旧件";
}

/** 挂账设备：已领用但旧件尚未回收入库（更换周期未结案） */
export function pendingDevices(state: AppState): Device[] {
  return state.devices.filter((d) => d.cycle !== null);
}

/** 领用登记：数量不得超过库存；同一设备旧件未回收入库前不得再次领用 */
export function checkIssue(state: AppState, deviceId: string, partId: string, qty: number): RuleResult {
  const device = state.devices.find((d) => d.id === deviceId);
  if (!device) return fail(RULES.DEVICE_MISSING, "目标设备不存在，整次拒绝");
  const part = state.parts.find((p) => p.id === partId);
  if (!part) return fail(RULES.PART_MISSING, "目标备件不存在，整次拒绝");
  if (!Number.isInteger(qty) || qty <= 0) {
    return fail(RULES.BAD_QTY, `领用数量 ${qty} 非法，必须为正整数，整次拒绝`);
  }
  if (device.cycle) {
    return fail(
      RULES.OLD_PART_NOT_RETURNED,
      `${device.name} 上一周期旧件未回收入库（当前阶段：${cycleStage(device)}），禁止再次领用，整次拒绝，库存与设备状态不变`
    );
  }
  if (qty > part.stock) {
    return fail(
      RULES.STOCK_EXCEEDED,
      `领用 ${qty} ${part.unit} 超过「${part.name}」现有库存 ${part.stock} ${part.unit}，整次拒绝，库存不变`
    );
  }
  return PASS;
}

/** 拆下旧件：必须存在已领用的更换周期，且未拆过 */
export function checkRemoval(state: AppState, deviceId: string): RuleResult {
  const device = state.devices.find((d) => d.id === deviceId);
  if (!device) return fail(RULES.DEVICE_MISSING, "目标设备不存在，整次拒绝");
  if (!device.cycle) {
    return fail(RULES.NO_ACTIVE_CYCLE, `${device.name} 当前没有领用记录，无可拆旧件，整次拒绝`);
  }
  if (device.cycle.removedAt) {
    return fail(RULES.STAGE_DONE, `${device.name} 旧件已登记拆下，请勿重复登记，整次拒绝`);
  }
  return PASS;
}

/** 安装新件：同一设备必须先拆下旧件 */
export function checkInstall(state: AppState, deviceId: string): RuleResult {
  const device = state.devices.find((d) => d.id === deviceId);
  if (!device) return fail(RULES.DEVICE_MISSING, "目标设备不存在，整次拒绝");
  if (!device.cycle) {
    return fail(RULES.NO_ACTIVE_CYCLE, `${device.name} 未领用备件，禁止直接安装新件，整次拒绝`);
  }
  if (!device.cycle.removedAt) {
    return fail(
      RULES.INSTALL_BEFORE_REMOVE,
      `同设备未拆先装：${device.name} 旧件尚未拆下，禁止安装新件，整次拒绝，设备状态不变`
    );
  }
  if (device.cycle.installedAt) {
    return fail(RULES.STAGE_DONE, `${device.name} 新件已登记安装，请勿重复登记，整次拒绝`);
  }
  return PASS;
}

/** 旧件回收入库：新件装机后方可回收结案，生成入库回执并解除设备只读 */
export function checkReturn(state: AppState, deviceId: string): RuleResult {
  const device = state.devices.find((d) => d.id === deviceId);
  if (!device) return fail(RULES.DEVICE_MISSING, "目标设备不存在，整次拒绝");
  if (!device.cycle) {
    return fail(RULES.NO_ACTIVE_CYCLE, `${device.name} 当前没有在修工单，无旧件可回收，整次拒绝`);
  }
  if (!device.cycle.installedAt) {
    return fail(
      RULES.RETURN_BEFORE_INSTALL,
      `${device.name} 新件尚未装机（当前阶段：${cycleStage(device)}），旧件回收暂不受理，整次拒绝`
    );
  }
  return PASS;
}

/** 交接班：本班仍有挂账设备（旧件未回收入库）不得完成交接 */
export function checkHandover(state: AppState): RuleResult {
  const pending = pendingDevices(state);
  if (pending.length > 0) {
    const names = pending.map((d) => `${d.name}（${cycleStage(d)}）`).join("、");
    return fail(
      RULES.PENDING_DEVICES,
      `本班仍有挂账设备：${names}，旧件未回收入库，不得完成交接，整次拒绝`
    );
  }
  return PASS;
}
