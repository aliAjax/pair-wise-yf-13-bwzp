import { useState, type FormEvent } from "react";
import { nextShift } from "../data/seed";
import { deviceName, partName, validateHandover } from "../domain/rules";
import type { StationState } from "../domain/types";

interface Props {
  state: StationState;
  onHandover: (operator: string, note: string) => void;
}

export default function HandoverPage({ state, onHandover }: Props) {
  const [operator, setOperator] = useState("值班轮机员");
  const [note, setNote] = useState("");
  const [result, setResult] = useState<{ ok: boolean; lines: string[] } | null>(null);

  const shiftTickets = state.tickets.filter((t) => t.shift === state.currentShift);
  const pending = shiftTickets.filter((t) => t.status === "pending");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const violations = validateHandover(state);
    onHandover(operator.trim() || "值班轮机员", note.trim());
    if (violations.length > 0) {
      setResult({ ok: false, lines: [...violations.map((v) => v.message), "已记入异常时间线"] });
    } else {
      setResult({ ok: true, lines: [`${state.currentShift} 交接完成，进入 ${nextShift(state.currentShift)}`] });
    }
    setNote("");
  }

  return (
    <>
      <section className="workspace">
        <aside className="panel">
          <h2>本班挂账设备</h2>
          {pending.length === 0 ? (
            <p className="ok-text">本班工单全部闭环，可以交接。</p>
          ) : (
            <ul className="pending-list">
              {pending.map((t) => (
                <li key={t.id}>
                  <b>{deviceName(state, t.deviceId)}</b> · 工单 {t.id} · 旧件未回收入库
                </li>
              ))}
            </ul>
          )}
          <p className="hint">本班仍有挂账设备不得完成交接；请先在「设备与库存」登记备件入库回执。</p>
        </aside>

        <section className="panel form-panel">
          <div className="heading">
            <div>
              <p>交接班</p>
              <h2>
                {state.currentShift} → {nextShift(state.currentShift)}
              </h2>
            </div>
          </div>
          <p className="hint">
            本班登记 {shiftTickets.length} 单 · 已闭环 {shiftTickets.length - pending.length} 单 · 挂账 {pending.length} 单
          </p>
          <form onSubmit={handleSubmit}>
            <div className="field-grid">
              <label>
                <span>交班人</span>
                <input value={operator} onChange={(e) => setOperator(e.target.value)} />
              </label>
              <label>
                <span>交接备注</span>
                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="选填" />
              </label>
            </div>
            <div className="form-actions">
              <button type="submit" className="primary">
                完成交接
              </button>
            </div>
          </form>
          {result && (
            <div className={`result ${result.ok ? "ok" : "fail"}`}>
              {result.lines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          )}
        </section>
      </section>

      <section className="panel">
        <div className="heading">
          <div>
            <p>本班工单</p>
            <h2>{state.currentShift} 登记明细</h2>
          </div>
        </div>
        {shiftTickets.length === 0 ? (
          <p className="empty">本班暂无登记</p>
        ) : (
          <div className="records">
            {shiftTickets.map((t, index) => (
              <article key={t.id}>
                <b>{String(index + 1).padStart(2, "0")}</b>
                <div>
                  <h3>
                    {deviceName(state, t.deviceId)} · {partName(state, t.partId)} ×{t.qty}
                  </h3>
                  <p>
                    工单 {t.id} · 经办 {t.operator} ·{" "}
                    {t.status === "pending" ? "挂账中（旧件未回收入库）" : `已闭环 · 回执 ${t.receiptNo}`}
                    {t.note ? ` · ${t.note}` : ""}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <div className="heading">
          <div>
            <p>历史交接</p>
            <h2>交接记录</h2>
          </div>
        </div>
        {state.handovers.length === 0 ? (
          <p className="empty">暂无交接记录</p>
        ) : (
          <div className="records">
            {state.handovers.map((h, index) => (
              <article key={h.id}>
                <b>{String(index + 1).padStart(2, "0")}</b>
                <div>
                  <h3>
                    {h.shift} → {h.toShift}
                  </h3>
                  <p>
                    {h.at} · 交班 {h.operator} · 本班登记 {h.ticketCount} 单{h.note ? ` · ${h.note}` : ""}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
