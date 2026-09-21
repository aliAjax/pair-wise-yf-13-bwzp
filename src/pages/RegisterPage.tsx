import { useMemo, useState, type FormEvent } from "react";
import { validateReplacement, type ReplacementCommand } from "../domain/rules";
import type { StationState } from "../domain/types";

interface Props {
  state: StationState;
  onRegister: (cmd: ReplacementCommand) => void;
}

interface Result {
  ok: boolean;
  lines: string[];
}

export default function RegisterPage({ state, onRegister }: Props) {
  const [deviceId, setDeviceId] = useState(state.devices[0]?.id ?? "");
  const [partId, setPartId] = useState("");
  const [qty, setQty] = useState(1);
  const [removedOld, setRemovedOld] = useState(true);
  const [installedNew, setInstalledNew] = useState(true);
  const [operator, setOperator] = useState("值班轮机员");
  const [note, setNote] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  const compatible = useMemo(
    () => state.parts.filter((p) => p.deviceIds.includes(deviceId)),
    [state.parts, deviceId]
  );
  const effectivePartId = compatible.some((p) => p.id === partId) ? partId : compatible[0]?.id ?? "";
  const part = state.parts.find((p) => p.id === effectivePartId);
  const device = state.devices.find((d) => d.id === deviceId);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cmd: ReplacementCommand = {
      deviceId,
      partId: effectivePartId,
      qty,
      removedOld,
      installedNew,
      operator: operator.trim() || "值班轮机员",
      note: note.trim(),
    };
    const violations = validateReplacement(state, cmd);
    onRegister(cmd);
    if (violations.length > 0) {
      setResult({ ok: false, lines: ["整次拒绝：原库存与设备状态不变，已记入异常时间线", ...violations.map((v) => v.message)] });
    } else {
      setResult({
        ok: true,
        lines: [
          `工单登记成功：${part?.name ?? ""} ×${qty} 已领用出库`,
          `${device?.name ?? ""} 转入挂账（只读），待备件入库回执后解除`,
        ],
      });
    }
  }

  return (
    <section className="workspace">
      <aside className="panel">
        <h2>校验规则</h2>
        <ul className="rule-list">
          <li>领用数量超过库存 → 整次拒绝</li>
          <li>同设备未拆先装 → 整次拒绝</li>
          <li>旧件未回收入库（设备挂账只读）→ 整次拒绝</li>
        </ul>
        <p className="hint">任一规则不通过，整次登记拒绝，原库存与设备状态不变，并记入异常时间线。</p>
        <div className="shift-now">
          <span>当前班次</span>
          <b>{state.currentShift}</b>
        </div>
      </aside>

      <section className="panel form-panel">
        <div className="heading">
          <div>
            <p>按班次登记</p>
            <h2>领用 · 拆旧 · 装新</h2>
          </div>
          <span className="badge badge-shift">{state.currentShift}</span>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="field-grid">
            <label>
              <span>设备名称</span>
              <select value={deviceId} onChange={(e) => setDeviceId(e.target.value)}>
                {state.devices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}（{d.location}）{d.readOnly ? " · 挂账只读" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>备件（适配所选设备）</span>
              <select value={effectivePartId} onChange={(e) => setPartId(e.target.value)}>
                {compatible.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · 在库 {p.stock} {p.unit}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>领用数量{part ? `（在库 ${part.stock} ${part.unit}）` : ""}</span>
              <input type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value))} />
            </label>
            <label>
              <span>经办人</span>
              <input value={operator} onChange={(e) => setOperator(e.target.value)} />
            </label>
          </div>
          <div className="step-row">
            <label className="check">
              <input type="checkbox" checked={removedOld} onChange={(e) => setRemovedOld(e.target.checked)} />
              <span>已拆下旧件</span>
            </label>
            <span className="step-arrow">→</span>
            <label className="check">
              <input type="checkbox" checked={installedNew} onChange={(e) => setInstalledNew(e.target.checked)} />
              <span>已安装新件</span>
            </label>
            <span className="hint">安装新件前必须先拆下旧件，否则整次拒绝。</span>
          </div>
          <label>
            <span>备注</span>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="选填：拆检情况、旧件状态等" />
          </label>
          <div className="form-actions">
            <button type="submit" className="primary">
              提交登记
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
  );
}
