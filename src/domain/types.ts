export interface SparePart {
  id: string;
  code: string;
  name: string;
  spec: string;
  unit: string;
  stock: number;
  deviceIds: string[];
}

export type DeviceStatus = "normal" | "pending";

export interface Device {
  id: string;
  name: string;
  location: string;
  installedPart: string;
  status: DeviceStatus;
  readOnly: boolean;
  activeTicketId: string | null;
}

export type TicketStatus = "pending" | "closed";

export interface ReplacementTicket {
  id: string;
  shift: string;
  deviceId: string;
  partId: string;
  qty: number;
  removedOld: boolean;
  installedNew: boolean;
  operator: string;
  note: string;
  status: TicketStatus;
  createdAt: string;
  receiptNo: string | null;
  closedAt: string | null;
}

export type EventKind = "register" | "receipt" | "handover" | "exception" | "system";

export interface TimelineEvent {
  id: string;
  at: string;
  shift: string;
  deviceId: string | null;
  kind: EventKind;
  title: string;
  detail: string;
}

export interface HandoverRecord {
  id: string;
  shift: string;
  toShift: string;
  at: string;
  operator: string;
  note: string;
  ticketCount: number;
}

export interface StationState {
  currentShift: string;
  parts: SparePart[];
  devices: Device[];
  tickets: ReplacementTicket[];
  events: TimelineEvent[];
  handovers: HandoverRecord[];
  seq: number;
}

export const EVENT_KIND_LABEL: Record<EventKind, string> = {
  register: "更换登记",
  receipt: "入库回执",
  handover: "交接班",
  exception: "异常",
  system: "系统",
};
