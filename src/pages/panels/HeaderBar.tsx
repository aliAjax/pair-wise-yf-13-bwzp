import type { Dispatch } from "react";
import { nextShift, shiftLabel } from "../../domain/seed";
import type { Action } from "../../domain/store";
import type { AppState } from "../../domain/types";

interface Props {
  state: AppState;
  dispatch: Dispatch<Action>;
  savedAt: string | null;
}

export default function HeaderBar({ state, dispatch, savedAt }: Props) {
  const onReset = () => {
    if (window.confirm("确定要清空浏览器存档并恢复预置的 4 台设备、6 件备件吗？")) {
      dispatch({ type: "reset" });
    }
  };

  return (
    <section className="hero">
      <div className="hero-main">
        <p>hxyfront-62001 · 船舶轮机 · 备件更换台</p>
        <h1>船舶轮机备件更换台</h1>
        <span>
          按班次登记领用、拆下旧件与安装新件；领用超量、同设备未拆先装、旧件未回收入库均整次拒绝，
          原库存与设备状态不变。旧件入库回执生成后设备解除只读，本班仍有挂账设备不得完成交接。
        </span>
        <div className="hero-actions">
          <span className="archive-badge" title="状态与筛选实时写入 localStorage，并跨标签页同步">
            浏览器存档已同步{savedAt ? ` · ${savedAt}` : ""}
          </span>
          <button type="button" onClick={onReset}>重置存档</button>
        </div>
      </div>
      <div className="shift-card">
        <small>当前班次</small>
        <strong>{shiftLabel(state.currentShift)}</strong>
        <em>完成交接后转入 {shiftLabel(nextShift(state.currentShift))}</em>
      </div>
    </section>
  );
}
