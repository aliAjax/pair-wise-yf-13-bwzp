import { useState, type FormEvent } from "react";
import type { StationState } from "../domain/types";

interface Props {
  state: StationState;
  onReceipt: (ticketId: string, receiptNo: string, operator: string) => void;
}

export default function BoardPage({ state, onReceipt }: Props) {
  return (
    <>
      <section className="device-grid">
        {state.devices.map((device) => {
          const ticket = state.tickets.find((t) => t.id === device.activeTicketId);
          const part = ticket ? state.parts.find((p) => p.id === ticket.partId) : undefined;
          return (
            <article key={device.id} className={`device-card ${device.readOnly ? "locked" : ""}`}>
              <header>
                <h3>{device.name}</h3>
                <span className={`badge ${device.readOnly ? "badge-pending" : "badge-normal"}`}>
                  {device.readOnly ? "挂账 · 只读" : "正常"}
                </span>
              </header>
              <p className="device-meta">
                {device.location} · 在机件：{device.installedPart}
              </p>
              {ticket && (
                <div className="ticket-box">
                  <p>
                    工单 {ticket.id} · {ticket.shift} · 领用 {part?.name ?? ticket.partId} ×{ticket.qty} · 经办{" "}
                    {ticket.operator}
                  </p>
                  <ReceiptForm ticketId={ticket.id} onReceipt={onReceipt} />
                </div>
              )}
            </article>
          );
        })}
      </section>

      <section className="panel">
        <div className="heading">
          <div>
            <p>备件库存</p>
            <h2>六件预置备件</h2>
          </div>
        </div>
        <table className="stock-table">
          <thead>
            <tr>
              <th>编码</th>
              <th>名称</th>
              <th>规格</th>
              <th>适配设备</th>
              <th>在库</th>
            </tr>
          </thead>
          <tbody>
            {state.parts.map((p) => (
              <tr key={p.id}>
                <td>{p.code}</td>
                <td>{p.name}</td>
                <td>{p.spec}</td>
                <td>{p.deviceIds.map((id) => state.devices.find((d) => d.id === id)?.name ?? id).join("、")}</td>
                <td>
                  <span className={`stock-num ${p.stock <= 2 ? "low" : ""}`}>
                    {p.stock} {p.unit}
                  </span>
                  {p.stock <= 2 && <em className="low-hint">库存偏低</em>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}

function ReceiptForm({ ticketId, onReceipt }: { ticketId: string; onReceipt: Props["onReceipt"] }) {
  const [receiptNo, setReceiptNo] = useState("");
  const [operator, setOperator] = useState("值班轮机员");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!receiptNo.trim()) {
      setError("须填写备件入库回执号");
      return;
    }
    onReceipt(ticketId, receiptNo.trim(), operator.trim() || "值班轮机员");
    setReceiptNo("");
    setError("");
  }

  return (
    <form className="receipt-form" onSubmit={handleSubmit}>
      <div className="receipt-fields">
        <input
          placeholder="入库回执号，如 RC-2026-091"
          value={receiptNo}
          onChange={(e) => setReceiptNo(e.target.value)}
        />
        <input placeholder="确认人" value={operator} onChange={(e) => setOperator(e.target.value)} />
        <button type="submit" className="primary">
          旧件回收入库
        </button>
      </div>
      {error && <p className="field-error">{error}</p>}
      <p className="hint">回执登记后工单闭环，设备解除只读。</p>
    </form>
  );
}
