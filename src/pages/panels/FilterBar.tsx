import { SHIFTS } from "../../domain/seed";
import type { AppState, FilterState } from "../../domain/types";

interface Props {
  state: AppState;
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

export default function FilterBar({ state, filters, onChange }: Props) {
  return (
    <section className="panel filter-bar">
      <div className="filter-group">
        <span className="filter-label">按设备筛选</span>
        <div className="chips">
          <button
            type="button"
            className={filters.deviceId === "all" ? "active" : ""}
            onClick={() => onChange({ ...filters, deviceId: "all" })}
          >
            全部设备
          </button>
          {state.devices.map((d) => (
            <button
              key={d.id}
              type="button"
              className={filters.deviceId === d.id ? "active" : ""}
              onClick={() => onChange({ ...filters, deviceId: d.id })}
            >
              {d.name}
            </button>
          ))}
        </div>
      </div>
      <div className="filter-group">
        <span className="filter-label">按班次筛选</span>
        <select
          value={filters.shift}
          onChange={(e) => onChange({ ...filters, shift: e.target.value })}
        >
          <option value="all">全部班次</option>
          {SHIFTS.map((s) => (
            <option key={s} value={s}>{s}班</option>
          ))}
        </select>
      </div>
    </section>
  );
}
