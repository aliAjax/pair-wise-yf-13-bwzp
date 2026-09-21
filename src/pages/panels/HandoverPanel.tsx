import { useState } from "react";
import type { Dispatch, FormEvent } from "react";
import { checkHandover, pendingDevices } from "../../domain/rules";
import { nextShift, shiftLabel } from "../../domain/seed";
import type { Action } from "../../domain/store";
import type { AppState } from "../../domain/types";
import { fmtTime } from "../format";

interface Props {
  state: AppState;
  dispatch: Dispatch<Action>;
}

export default function HandoverPanel({ state, dispatch }: Props) {
  const [operator, setOperator] = useState("当班轮机员");
  const [note, setNote] = useState("");

  const pending = pendingDevices(state);
  const check = checkHandover(state);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    dispatch({ type: "handover", operator, note });
    setNote("");
  };

  return (
    <section className="panel">
      <div className="heading">
        <div>
          <p>交接班</p>
          <h2>{shiftLabel(state.currentShift)} → {shiftLabel(nextShift(state.currentShift))}</h2>
        </div>
      </div>

      {pending.length > 0 ? (
        <div className="precheck bad">
          ✕ 本班仍有挂账设备 {pending.length} 台：{pending.map((d) => d.name).join("、")}，
          旧件回收入库前不得完成交接
        </div>
      ) : (
        <div className="precheck ok">✓ 本班无挂账设备，可完成交接</div>
      )}

      <form onSubmit={onSubmit}>
        <div className="field-grid">
          <label>
            <span>交班人</span>
            <input value={operator} onChange={(e) => setOperator(e.target.value)} />
          </label>
          <label>
            <span>交接备注</span>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="填写交接备注（可选）"
            />
          </label>
        </div>
        <button className="primary" type="submit" disabled={!check.ok}>
          完成交接
        </button>
      </form>

      {state.handovers.length > 0 && (
        <div className="handover-history">
          <h3>近期交接</h3>
          {state.handovers.slice(0, 3).map((h) => (
            <p key={h.id}>
              <b>{shiftLabel(h.shift)}</b> · {fmtTime(h.at)} · {h.operator} ·
              领用 {h.issueCount} / 回收 {h.returnCount} / 异常 {h.exceptionCount}
              {h.note ? ` · ${h.note}` : ""}
            </p>
          ))}
        </div>
      )}
    </section>
  );
}
