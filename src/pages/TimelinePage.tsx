import { SHIFTS } from "../data/seed";
import { EVENT_KIND_LABEL, type EventKind, type StationState } from "../domain/types";

export interface TimelineFilters {
  device: string;
  kind: string;
  shift: string;
}

interface Props {
  state: StationState;
  filters: TimelineFilters;
  onFilters: (filters: TimelineFilters) => void;
}

const KINDS: EventKind[] = ["register", "receipt", "handover", "exception", "system"];

export default function TimelinePage({ state, filters, onFilters }: Props) {
  const events = state.events.filter((ev) => {
    if (filters.device !== "all" && ev.deviceId !== filters.device) return false;
    if (filters.kind !== "all" && ev.kind !== filters.kind) return false;
    if (filters.shift !== "all" && ev.shift !== filters.shift) return false;
    return true;
  });
  const exceptionCount = events.filter((ev) => ev.kind === "exception").length;

  return (
    <section className="panel">
      <div className="heading">
        <div>
          <p>全程留痕</p>
          <h2>异常时间线</h2>
        </div>
        <span className="hint">
          共 {events.length} 条 · 异常 {exceptionCount} 条 · 筛选随浏览器存档同步
        </span>
      </div>

      <div className="filter-bar">
        <div className="chips">
          <button className={filters.device === "all" ? "chip on" : "chip"} onClick={() => onFilters({ ...filters, device: "all" })}>
            全部设备
          </button>
          {state.devices.map((d) => (
            <button
              key={d.id}
              className={filters.device === d.id ? "chip on" : "chip"}
              onClick={() => onFilters({ ...filters, device: d.id })}
            >
              {d.name}
            </button>
          ))}
        </div>
        <div className="chips">
          <button className={filters.kind === "all" ? "chip on" : "chip"} onClick={() => onFilters({ ...filters, kind: "all" })}>
            全部类型
          </button>
          {KINDS.map((k) => (
            <button
              key={k}
              className={filters.kind === k ? "chip on" : "chip"}
              onClick={() => onFilters({ ...filters, kind: k })}
            >
              {EVENT_KIND_LABEL[k]}
            </button>
          ))}
        </div>
        <div className="chips">
          <button className={filters.shift === "all" ? "chip on" : "chip"} onClick={() => onFilters({ ...filters, shift: "all" })}>
            全部班次
          </button>
          {SHIFTS.map((s) => (
            <button
              key={s}
              className={filters.shift === s ? "chip on" : "chip"}
              onClick={() => onFilters({ ...filters, shift: s })}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {events.length === 0 ? (
        <p className="empty">暂无匹配记录</p>
      ) : (
        <ol className="timeline">
          {events.map((ev) => (
            <li key={ev.id} className={`tl-item kind-${ev.kind}`}>
              <span className="tl-dot" />
              <div className="tl-body">
                <div className="tl-head">
                  <span className={`badge badge-${ev.kind}`}>{EVENT_KIND_LABEL[ev.kind]}</span>
                  <strong>{ev.title}</strong>
                  <time>
                    {ev.at} · {ev.shift}
                  </time>
                </div>
                <p>{ev.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
