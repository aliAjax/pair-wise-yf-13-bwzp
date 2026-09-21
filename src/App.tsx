import { useEffect, useReducer, useState } from "react";
import "./styles.css";
import { loadState, reduce, saveState } from "./domain/store";
import { usePersistentState } from "./hooks";
import BoardPage from "./pages/BoardPage";
import HandoverPage from "./pages/HandoverPage";
import RegisterPage from "./pages/RegisterPage";
import TimelinePage, { type TimelineFilters } from "./pages/TimelinePage";

const UI_KEY = "hxyfront-62001:spare-station:ui:v1";

type Tab = "register" | "board" | "timeline" | "handover";

interface UiState {
  tab: Tab;
  filters: TimelineFilters;
}

const TABS: { id: Tab; label: string }[] = [
  { id: "register", label: "更换登记" },
  { id: "board", label: "设备与库存" },
  { id: "timeline", label: "异常时间线" },
  { id: "handover", label: "交接班" },
];

export default function App() {
  const [state, dispatch] = useReducer(reduce, undefined, loadState);
  const [ui, setUi] = usePersistentState<UiState>(UI_KEY, {
    tab: "register",
    filters: { device: "all", kind: "all", shift: "all" },
  });
  const [savedAt, setSavedAt] = useState("");

  // 业务台账与浏览器存档同步，刷新后保留
  useEffect(() => {
    saveState(state);
    setSavedAt(new Date().toLocaleTimeString("zh-CN", { hour12: false }));
  }, [state]);

  const totalStock = state.parts.reduce((sum, p) => sum + p.stock, 0);
  const pendingDevices = state.devices.filter((d) => d.status === "pending").length;
  const shiftTickets = state.tickets.filter((t) => t.shift === state.currentShift).length;
  const exceptions = state.events.filter((e) => e.kind === "exception").length;

  return (
    <main className="app">
      <header className="hero">
        <p>船舶轮机 · 备件更换台</p>
        <h1>船舶轮机备件更换台</h1>
        <span>
          按班次登记领用、拆下旧件与安装新件；超库存、未拆先装、旧件未回收任一发生即整次拒绝，原库存与设备状态不变。
          备件入库回执登记后解除设备只读，本班无挂账设备方可完成交接。
        </span>
        <div className="hero-meta">
          <span className="badge badge-shift">当前班次 {state.currentShift}</span>
          <span className="save-state">浏览器存档{savedAt ? `已同步 ${savedAt}` : "同步中…"}</span>
          <button
            className="ghost"
            onClick={() => {
              if (window.confirm("确定清空浏览器存档并恢复预置台账？")) dispatch({ type: "reset" });
            }}
          >
            重置台账
          </button>
        </div>
      </header>

      <section className="metrics">
        <article>
          <small>在库备件</small>
          <strong>{totalStock}</strong>
        </article>
        <article>
          <small>挂账设备</small>
          <strong>{pendingDevices}</strong>
        </article>
        <article>
          <small>本班登记</small>
          <strong>{shiftTickets}</strong>
        </article>
        <article>
          <small>异常事件</small>
          <strong>{exceptions}</strong>
        </article>
      </section>

      <nav className="tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={ui.tab === tab.id ? "tab on" : "tab"}
            onClick={() => setUi({ ...ui, tab: tab.id })}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {ui.tab === "register" && (
        <RegisterPage state={state} onRegister={(cmd) => dispatch({ type: "register", cmd })} />
      )}
      {ui.tab === "board" && (
        <BoardPage
          state={state}
          onReceipt={(ticketId, receiptNo, operator) => dispatch({ type: "receipt", ticketId, receiptNo, operator })}
        />
      )}
      {ui.tab === "timeline" && (
        <TimelinePage state={state} filters={ui.filters} onFilters={(filters) => setUi({ ...ui, filters })} />
      )}
      {ui.tab === "handover" && (
        <HandoverPage state={state} onHandover={(operator, note) => dispatch({ type: "handover", operator, note })} />
      )}
    </main>
  );
}
