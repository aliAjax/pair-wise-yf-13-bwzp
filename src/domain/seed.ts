import type { AppState, Device, ShiftId, SparePart } from "./types";

// ============ 预置业务数据：班次、4 台设备、6 件备件 ============

export const SHIFTS: ShiftId[] = ["00-04", "04-08", "08-12", "12-16", "16-20", "20-24"];

export function nextShift(shift: ShiftId): ShiftId {
  const idx = SHIFTS.indexOf(shift);
  return SHIFTS[(idx + 1) % SHIFTS.length];
}

export function shiftLabel(shift: ShiftId): string {
  return `${shift}班`;
}

/** 预置 6 件备件 */
export const seedParts: SparePart[] = [
  { id: "P-01", code: "SP-CYL-001", name: "主机缸套组件", unit: "套", stock: 2, safetyStock: 1, location: "机舱备件架 A1" },
  { id: "P-02", code: "SP-INJ-014", name: "喷油嘴", unit: "只", stock: 6, safetyStock: 2, location: "机舱备件架 A2" },
  { id: "P-03", code: "SP-FLT-207", name: "滑油滤芯", unit: "只", stock: 4, safetyStock: 2, location: "机舱备件架 B1" },
  { id: "P-04", code: "SP-IMP-033", name: "海水泵叶轮", unit: "件", stock: 1, safetyStock: 1, location: "机舱备件架 B3" },
  { id: "P-05", code: "SP-SEA-118", name: "舵机液压密封包", unit: "包", stock: 3, safetyStock: 1, location: "舵机舱备件柜 C1" },
  { id: "P-06", code: "SP-SEN-052", name: "排温传感器", unit: "支", stock: 5, safetyStock: 2, location: "集控室备件柜 D2" },
];

/** 预置 4 台设备 */
export const seedDevices: Device[] = [
  { id: "D-01", name: "主机 #1", category: "推进动力", model: "MAN 6S35MC", status: "normal", cycle: null, lastReceipt: null },
  { id: "D-02", name: "发电机 #2", category: "电力", model: "CAT C18", status: "normal", cycle: null, lastReceipt: null },
  { id: "D-03", name: "舵机", category: "操舵", model: "Rolls SR662", status: "normal", cycle: null, lastReceipt: null },
  { id: "D-04", name: "舱底泵 #1", category: "泵组", model: "Shinko CV200", status: "normal", cycle: null, lastReceipt: null },
];

/** 出厂状态 */
export function seedState(): AppState {
  return {
    parts: structuredClone(seedParts),
    devices: structuredClone(seedDevices),
    currentShift: "08-12",
    ledger: [],
    exceptions: [],
    handovers: [],
    seq: 0,
  };
}
