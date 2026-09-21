import type { Dispatch } from "react";
import type { Action } from "../domain/store";
import type { AppState, FilterState } from "../domain/types";
import DevicePanel from "./panels/DevicePanel";
import FilterBar from "./panels/FilterBar";
import HandoverPanel from "./panels/HandoverPanel";
import HeaderBar from "./panels/HeaderBar";
import HistoryPanel from "./panels/HistoryPanel";
import InventoryPanel from "./panels/InventoryPanel";
import MetricsRow from "./panels/MetricsRow";
import OperationPanel from "./panels/OperationPanel";
import TimelinePanel from "./panels/TimelinePanel";

interface Props {
  state: AppState;
  dispatch: Dispatch<Action>;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  savedAt: string | null;
}

export default function WorkbenchPage({ state, dispatch, filters, onFiltersChange, savedAt }: Props) {
  return (
    <main className="app">
      <HeaderBar state={state} dispatch={dispatch} savedAt={savedAt} />
      <MetricsRow state={state} />

      <div className="workspace">
        <aside className="col-side">
          <InventoryPanel parts={state.parts} />
          <DevicePanel devices={state.devices} />
        </aside>
        <div className="col-main">
          <OperationPanel state={state} dispatch={dispatch} />
          <HandoverPanel state={state} dispatch={dispatch} />
        </div>
      </div>

      <FilterBar state={state} filters={filters} onChange={onFiltersChange} />

      <div className="boards">
        <TimelinePanel state={state} filters={filters} />
        <HistoryPanel state={state} filters={filters} />
      </div>
    </main>
  );
}
