import type { AppState, FilterState } from "../../domain/types";
import { ACTION_META, fmtTime } from "../format";

interface Props {
  state: AppState;
  filters: FilterState;
}

export default function HistoryPanel({ state, filters }: Props) {
  const entries = state.ledger.filter(
    (e) =>
      (filters.deviceId === "all" || e.deviceId === filters.deviceId) &&
      (filters.shift === "all" || e.shift === filters.shift)
  );

  return (
    <section className="panel">
      <div className="heading">
        <div>
          <p>操作流水</p>
          <h2>登记历史（{entries.length}）</h2>
        </div>
      </div>
      {entries.length === 0 ? (
        <p className="empty">当前筛选下暂无登记记录。</p>
      ) : (
        <div className="records">
          {entries.map((e) => {
            const meta = ACTION_META[e.action];
            return (
              <article key={e.id}>
                <span className={`action-tag ${meta.className}`}>{meta.label}</span>
                <div>
                  <h3>
                    {e.deviceName}
                    <span className="shift-tag">{e.shift}班</span>
                    <time>{fmtTime(e.at)}</time>
                  </h3>
                  <p>{e.detail}</p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
