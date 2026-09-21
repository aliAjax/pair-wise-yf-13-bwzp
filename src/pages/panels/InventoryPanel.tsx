import type { SparePart } from "../../domain/types";

export default function InventoryPanel({ parts }: { parts: SparePart[] }) {
  return (
    <section className="panel">
      <div className="heading">
        <div>
          <p>备件库存</p>
          <h2>在库 6 件备件</h2>
        </div>
      </div>
      <table className="stock-table">
        <thead>
          <tr>
            <th>编号</th>
            <th>名称</th>
            <th>库位</th>
            <th>库存</th>
          </tr>
        </thead>
        <tbody>
          {parts.map((p) => {
            const low = p.stock <= p.safetyStock;
            return (
              <tr key={p.id} className={low ? "low-stock" : ""}>
                <td>{p.code}</td>
                <td>{p.name}</td>
                <td>{p.location}</td>
                <td>
                  <b>{p.stock}</b> {p.unit}
                  {low && <i title={`安全库存 ${p.safetyStock}`}>低</i>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
