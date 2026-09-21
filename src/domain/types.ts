// ============ 业务数据模型（领域层，不含校验与页面） ============

export type ShiftId = "00-04" | "04-08" | "08-12" | "12-16" | "16-20" | "20-24";

/** 备件库存项 */
export interface SparePart {
  id: string;
  code: string; // 备件编号
  name: string;
  unit: string;
  stock: number; // 当前库存
  safetyStock: number; // 安全库存（低于则告警）
  location: string; // 库位
}

/** 设备状态：normal=正常可登记；locked=更换中，只读 */
export type DeviceStatus = "normal" | "locked";

/** 一次更换周期：领用 → 拆旧 → 装新 → 旧件回收入库（回执结案） */
export interface ReplacementCycle {
  id: string;
  shift: ShiftId; // 发起班次
  deviceId: string;
  partId: string;
  partName: string;
  qty: number;
  issuedAt: string; // 领用时间
  removedAt: string | null; // 拆下旧件时间
  installedAt: string | null; // 安装新件时间
  returnedAt: string | null; // 旧件回收入库时间
  receiptNo: string | null; // 入库回执号
}

export interface Device {
  id: string;
  name: string;
  category: string;
  model: string;
  status: DeviceStatus;
  cycle: ReplacementCycle | null; // 进行中的更换周期（挂账）
  lastReceipt: string | null; // 最近一次入库回执号
}

export type LedgerAction = "issue" | "remove" | "install" | "return" | "handover";

/** 操作流水（仅记录校验通过的登记） */
export interface LedgerEntry {
  id: string;
  at: string;
  shift: ShiftId;
  deviceId: string | null;
  deviceName: string;
  action: LedgerAction;
  detail: string;
}

/** 异常事件（校验拒绝，进入异常时间线） */
export interface ExceptionEvent {
  id: string;
  at: string;
  shift: ShiftId;
  deviceId: string | null;
  deviceName: string;
  rule: string; // 触发的校验规则
  message: string;
}

/** 交接班记录 */
export interface HandoverRecord {
  id: string;
  shift: ShiftId;
  at: string;
  operator: string;
  note: string;
  issueCount: number;
  returnCount: number;
  exceptionCount: number;
}

/** 应用状态（整体持久化到浏览器存档） */
export interface AppState {
  parts: SparePart[];
  devices: Device[];
  currentShift: ShiftId;
  ledger: LedgerEntry[];
  exceptions: ExceptionEvent[];
  handovers: HandoverRecord[];
  seq: number; // 单号自增序列
}

/** 筛选条件（同样持久化，刷新保留） */
export interface FilterState {
  deviceId: string; // "all" 或设备 id
  shift: string; // "all" 或班次
}
