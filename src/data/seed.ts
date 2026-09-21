import type { Device, SparePart, StationState } from "../domain/types";
import { now } from "../utils";

export const SHIFTS: string[] = ["00-04班", "04-08班", "08-12班", "12-16班", "16-20班", "20-24班"];

export function nextShift(shift: string): string {
  const index = SHIFTS.indexOf(shift);
  return SHIFTS[(index + 1 + SHIFTS.length) % SHIFTS.length];
}

/** 预置四台设备 */
export const seedDevices: Device[] = [
  { id: "D-ME", name: "主机", location: "机舱底层", installedPart: "主轴承轴瓦（在机 4200h）", status: "normal", readOnly: false, activeTicketId: null },
  { id: "D-GE2", name: "发电机#2", location: "机舱二层", installedPart: "喷油嘴总成（在机 2600h）", status: "normal", readOnly: false, activeTicketId: null },
  { id: "D-SWP", name: "主海水泵", location: "机舱底层", installedPart: "机械密封（在机 5100h）", status: "normal", readOnly: false, activeTicketId: null },
  { id: "D-OSP", name: "分油机", location: "机舱二层", installedPart: "分离片组（在机 1800h）", status: "normal", readOnly: false, activeTicketId: null },
];

/** 预置六件备件 */
export const seedParts: SparePart[] = [
  { id: "P-101", code: "SP-101", name: "主轴承轴瓦", spec: "STD 0.25", unit: "副", stock: 4, deviceIds: ["D-ME"] },
  { id: "P-102", code: "SP-102", name: "喷油嘴总成", spec: "L23/30H", unit: "只", stock: 6, deviceIds: ["D-ME", "D-GE2"] },
  { id: "P-103", code: "SP-103", name: "缸套密封圈", spec: "φ320", unit: "套", stock: 8, deviceIds: ["D-ME", "D-GE2"] },
  { id: "P-104", code: "SP-104", name: "机械密封", spec: "MG1-45", unit: "套", stock: 3, deviceIds: ["D-SWP"] },
  { id: "P-105", code: "SP-105", name: "分离片组", spec: "SJ-700", unit: "组", stock: 5, deviceIds: ["D-OSP"] },
  { id: "P-106", code: "SP-106", name: "排气阀", spec: "D=140", unit: "只", stock: 2, deviceIds: ["D-ME"] },
];

export function buildInitialState(): StationState {
  return {
    currentShift: "08-12班",
    parts: seedParts.map((p) => ({ ...p, deviceIds: [...p.deviceIds] })),
    devices: seedDevices.map((d) => ({ ...d })),
    tickets: [],
    events: [
      {
        id: "EV-0000",
        at: now(),
        shift: "08-12班",
        deviceId: null,
        kind: "system",
        title: "更换台台账初始化",
        detail: "预置 4 台设备、6 件备件；登记、回收、交接全程留痕，数据保存在浏览器本地。",
      },
    ],
    handovers: [],
    seq: 1,
  };
}
