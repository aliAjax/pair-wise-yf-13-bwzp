import { useMemo, useState } from "react";
import type { Dispatch, FormEvent } from "react";
import { checkInstall, checkIssue, checkRemoval, checkReturn, cycleStage } from "../../domain/rules";
import type { Action } from "../../domain/store";
import type { AppState } from "../../domain/types";

type OpTab = "issue" | "remove" | "install" | "return";

const TABS: { key: OpTab; label: string; hint: string }[] = [
  { key: "issue", label: "领用登记", hint: "从仓库领出备件，设备转入更换中（只读）" },
  { key: "remove", label: "拆下旧件", hint: "登记旧件拆下，方可安装新件" },
  { key: "install", label: "安装新件", hint: "同设备未拆先装将被整次拒绝" },
  { key: "return", label: "旧件回收入库", hint: "生成入库回执，解除设备只读" },
];

interface Props {
  state: AppState;
  dispatch: Dispatch<Action>;
}

export default function OperationPanel({ state, dispatch }: Props) {
  const [tab, setTab] = useState<OpTab>("issue");
  const [deviceId, setDeviceId] = useState(state.devices[0]?.id ?? "");
  const [partId, setPartId] = useState(state.parts[0]?.id ?? "");
  const [qty, setQty] = useState(1);

  const device = state.devices.find((d) => d.id === deviceId);
  const part = state.parts.find((p) => p.id === partId);

  // 实时预检：直接复用校验规则层的纯函数，提交前后口径一致
  const check = useMemo(() => {
    switch (tab) {
      case "issue":
        return checkIssue(state, deviceId, partId, qty);
      case "remove":
        return checkRemoval(state, deviceId);
      case "install":
        return checkInstall(state, deviceId);
      case "return":
        return checkReturn(state, deviceId);
    }
  }, [state, tab, deviceId, partId, qty]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    // 无论校验是否通过都提交：不通过时由仓库整次拒绝并记入异常时间线
    if (tab === "issue") dispatch({ type: "issue", deviceId, partId, qty });
    if (tab === "remove") dispatch({ type: "remove", deviceId });
    if (tab === "install") dispatch({ type: "install", deviceId });
    if (tab === "return") dispatch({ type: "return", deviceId });
  };

  return (
    <section className="panel form-panel">
      <div className="heading">
        <div>
          <p>操作台 · {state.currentShift}班登记</p>
          <h2>备件更换登记</h2>
        </div>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={tab === t.key ? "active" : ""}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="tab-hint">{TABS.find((t) => t.key === tab)?.hint}</p>

      <form onSubmit={onSubmit}>
        <div className="field-grid">
          <label>
            <span>设备名称</span>
            <select value={deviceId} onChange={(e) => setDeviceId(e.target.value)}>
              {state.devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}{d.status === "locked" ? "（更换中·只读）" : ""}
                </option>
              ))}
            </select>
          </label>

          {tab === "issue" && (
            <>
              <label>
                <span>备件</span>
                <select value={partId} onChange={(e) => setPartId(e.target.value)}>
                  {state.parts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}（库存 {p.stock} {p.unit}）
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>领用数量</span>
                <input
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                />
              </label>
            </>
          )}

          {tab !== "issue" && device && (
            <div className="cycle-brief">
              {device.cycle
                ? `工单 ${device.cycle.id} · 「${device.cycle.partName}」×${device.cycle.qty} · ${cycleStage(device)}`
                : "该设备当前无在修工单"}
            </div>
          )}
        </div>

        <div className={`precheck ${check.ok ? "ok" : "bad"}`}>
          {check.ok ? "✓ 校验通过，可提交登记" : `✕ ${check.rule}：${check.message}`}
        </div>

        <button className="primary" type="submit">
          提交登记（{TABS.find((t) => t.key === tab)?.label}）
        </button>
        {part && tab === "issue" && (
          <p className="after-stock">
            提交后「{part.name}」库存 {part.stock} → {Math.max(part.stock - qty, 0)} {part.unit}
            （校验拒绝时不变）
          </p>
        )}
      </form>
    </section>
  );
}
