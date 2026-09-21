import { cycleStage } from "../../domain/rules";
import type { Device } from "../../domain/types";

const STEPS = ["领用", "拆旧", "装新", "回收"] as const;

function stepState(device: Device, index: number): "done" | "current" | "todo" {
  const c = device.cycle;
  if (!c) return "todo";
  const flags = [true, c.removedAt !== null, c.installedAt !== null, c.returnedAt !== null];
  if (flags[index]) return "done";
  return flags.slice(0, index).every(Boolean) ? "current" : "todo";
}

export default function DevicePanel({ devices }: { devices: Device[] }) {
  return (
    <section className="panel">
      <div className="heading">
        <div>
          <p>设备状态</p>
          <h2>4 台在管设备</h2>
        </div>
      </div>
      <div className="device-list">
        {devices.map((d) => (
          <article key={d.id} className={`device-card ${d.status}`}>
            <header>
              <div>
                <h3>{d.name}</h3>
                <p>{d.category} · {d.model}</p>
              </div>
              <span className={`status-badge ${d.status}`}>
                {d.status === "locked" ? "更换中 · 只读" : "正常"}
              </span>
            </header>
            {d.cycle ? (
              <>
                <div className="steps">
                  {STEPS.map((label, i) => (
                    <span key={label} className={`step ${stepState(d, i)}`}>
                      <b>{i + 1}</b>
                      {label}
                    </span>
                  ))}
                </div>
                <p className="cycle-info">
                  工单 {d.cycle.id} · {d.cycle.shift}班领用「{d.cycle.partName}」×{d.cycle.qty} · {cycleStage(d)}
                </p>
              </>
            ) : (
              <p className="cycle-info idle">
                无在修工单{d.lastReceipt ? ` · 上次入库回执 ${d.lastReceipt}` : ""}
              </p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
