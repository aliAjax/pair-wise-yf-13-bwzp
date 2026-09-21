import type { AppState, FilterState } from "../../domain/types";
import { fmtTime } from "../format";

interface Props {
  state: AppState;
  filters: FilterState;
}

export default function TimelinePanel({ state, filters }: Props) {
  const events = state.exceptions.filter(
    (e) =>
      (filters.deviceId === "all" || e.deviceId === filters.deviceId) &&
      (filters.shift === "all" || e.shift === filters.shift)
  );

  return (
    <section className="panel">
      <div className="heading">
        <div>
          <p>异常时间线</p>
          <h2>校验拒绝记录（{events.length}）</h2>
        </div>
      </div>
      {events.length === 0 ? (
        <p className="empty">当前筛选下暂无异常，校验全部通过。</p>
      ) : (
        <div className="timeline">
          {events.map((e) => (
            <article key={e.id}>
              <span className="dot" />
              <div>
                <header>
                  <b>{fmtTime(e.at)}</b>
                  <span className="shift-tag">{e.shift}班</span>
                  <span className="device-tag">{e.deviceName}</span>
                  <span className="rule-tag">{e.rule}</span>
                </header>
                <p>{e.message}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
