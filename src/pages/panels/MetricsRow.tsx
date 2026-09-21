import { pendingDevices } from "../../domain/rules";
import type { AppState } from "../../domain/types";

export default function MetricsRow({ state }: { state: AppState }) {
  const totalStock = state.parts.reduce((sum, p) => sum + p.stock, 0);
  const locked = state.devices.filter((d) => d.status === "locked").length;
  const pending = pendingDevices(state).length;
  const lowStock = state.parts.filter((p) => p.stock <= p.safetyStock).length;

  const metrics = [
    { label: "在库备件总数", value: totalStock, hint: `${state.parts.length} 个品类` },
    { label: "更换中设备（只读）", value: locked, hint: "入库回执后解除" },
    { label: "本班挂账设备", value: pending, hint: pending > 0 ? "交接被锁定" : "可交接" },
    { label: "异常事件", value: state.exceptions.length, hint: `低库存品类 ${lowStock}` },
  ];

  return (
    <section className="metrics">
      {metrics.map((m) => (
        <article key={m.label}>
          <small>{m.label}</small>
          <strong>{m.value}</strong>
          <em>{m.hint}</em>
        </article>
      ))}
    </section>
  );
}
