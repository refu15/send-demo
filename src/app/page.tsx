"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell, type Role, type ViewKey } from "@/components/app-shell";
import { Dashboard } from "@/components/dashboard";
import { DemoPasswordGate } from "@/components/demo-password-gate";
import { DriverView } from "@/components/driver-view";
import { ExportPanel } from "@/components/export-panel";
import { MasterManagement } from "@/components/master-management";
import type { StaffFormInput, UserFormInput, VehicleFormInput } from "@/components/master-management";
import { PlanSelector } from "@/components/plan-selector";
import { ResultsTable } from "@/components/results-table";
import { RidePlanEditor } from "@/components/ride-plan-editor";
import { RideStopTable } from "@/components/ride-stop-table";
import { SimulationPanel } from "@/components/simulation-panel";
import { deleteRideData, fetchRideData, patchRideData, postRideData } from "@/lib/api/client";
import { createEmptyRideData } from "@/lib/ride/app-state";
import { applyRideEvent, undoLastRideEvent } from "@/lib/ride/status";
import type { RideEvent, RideImportResult, RidePeriod, RideStop, StaffRole } from "@/lib/ride/types";

export default function Home() {
  const [role, setRole] = useState<Role>("admin");
  const [view, setView] = useState<ViewKey>("masters");
  const [masked, setMasked] = useState(true);
  const [data, setData] = useState<RideImportResult>(() => createEmptyRideData());
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [simulationBusy, setSimulationBusy] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>();

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    if (data.ridePlans.length === 0) {
      setSelectedPlanId(undefined);
      return;
    }
    if (!selectedPlanId || !data.ridePlans.some((plan) => plan.id === selectedPlanId)) {
      setSelectedPlanId(data.ridePlans[0].id);
    }
  }, [data.ridePlans, selectedPlanId]);

  const activePlan = data.ridePlans.find((plan) => plan.id === selectedPlanId) ?? data.ridePlans[0];
  const activeStops = useMemo(
    () =>
      activePlan
        ? data.rideStops
            .filter((stop) => stop.ridePlanId === activePlan.id)
            .sort((a, b) => a.order - b.order)
        : [],
    [activePlan, data.rideStops],
  );

  async function loadData() {
    try {
      setErrorMessage(undefined);
      setData(await fetchRideData());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "データ読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  }

  async function updateStop(updatedStop: RideStop) {
    await applyDataChange(() => patchRideData(`/api/ride-stops/${updatedStop.id}`, updatedStop));
  }

  async function moveStop(stop: RideStop, direction: "up" | "down") {
    await applyDataChange(() => postRideData(`/api/ride-stops/${stop.id}/move`, { direction }));
  }

  async function deleteStop(stop: RideStop) {
    await applyDataChange(() => deleteRideData(`/api/ride-stops/${stop.id}`));
  }

  function handleRideEvent(stop: RideStop, eventType: RideEvent["eventType"], note?: string) {
    const event: RideEvent = {
      id: `event-${Date.now()}`,
      rideStopId: stop.id,
      eventType,
      occurredAt: new Date().toISOString(),
      actorRole: role === "driver" ? "driver" : "admin",
      actorName: role,
      note,
    };
    void updateStop(applyRideEvent(stop, event));
  }

  function handleUndo(stop: RideStop) {
    void updateStop(undoLastRideEvent(stop));
  }

  function handleAddUser(input: {
    name: string;
    gender?: string;
    servicePattern?: string;
    phone?: string;
    address?: string;
    wheelchairRequired: boolean;
    medicineCheckRequired: boolean;
    note?: string;
  }) {
    void applyDataChange(() => postRideData("/api/users", input));
  }

  function handleAddVehicle(input: { name: string; capacity?: number; note?: string }) {
    void applyDataChange(() => postRideData("/api/vehicles", input));
  }

  function handleAddStaff(input: { name: string; role: StaffRole; qualification?: string }) {
    void applyDataChange(() => postRideData("/api/staff", input));
  }

  function handleUpdateUser(id: string, input: UserFormInput) {
    void applyDataChange(() => patchRideData(`/api/users/${id}`, input));
  }

  function handleUpdateVehicle(id: string, input: VehicleFormInput) {
    void applyDataChange(() => patchRideData(`/api/vehicles/${id}`, input));
  }

  function handleUpdateStaff(id: string, input: StaffFormInput) {
    void applyDataChange(() => patchRideData(`/api/staff/${id}`, input));
  }

  function handleDeleteUser(id: string, name: string) {
    if (window.confirm(`${name} を削除しますか？`)) {
      void applyDataChange(() => deleteRideData(`/api/users/${id}`));
    }
  }

  function handleDeleteVehicle(id: string, name: string) {
    if (window.confirm(`${name} を削除しますか？`)) {
      void applyDataChange(() => deleteRideData(`/api/vehicles/${id}`));
    }
  }

  function handleDeleteStaff(id: string, name: string) {
    if (window.confirm(`${name} を削除しますか？`)) {
      void applyDataChange(() => deleteRideData(`/api/staff/${id}`));
    }
  }

  function handleCreatePlan(input: {
    serviceDate?: string;
    weekday?: string;
    period: RidePeriod;
    vehicleId?: string;
    driverId?: string;
    attendantId?: string;
    weather?: string;
  }) {
    void applyDataChange(() => postRideData("/api/ride-plans", input));
    setView("planner");
  }

  function handleAddStop(input: {
    ridePlanId: string;
    userId: string;
    scheduledTime?: string;
    note?: string;
  }) {
    void applyDataChange(() => postRideData("/api/ride-stops", input));
    setView("plan");
  }

  async function applyDataChange(updater: () => Promise<RideImportResult>) {
    try {
      setErrorMessage(undefined);
      setData(await updater());
    } catch (error) {
      const message = error instanceof Error ? error.message : "データ更新に失敗しました";
      setErrorMessage(message);
      window.alert(message);
    }
  }

  async function handleLoadSimulation() {
    if (!window.confirm("現場シミュレーション用データでDBを置き換えます。続けますか？")) {
      return;
    }
    setSimulationBusy(true);
    try {
      await applyDataChange(() => postRideData("/api/simulation/field-day", {}));
    } finally {
      setSimulationBusy(false);
    }
  }

  async function handleClearDemoData() {
    if (!window.confirm("デモDBを空にします。続けますか？")) {
      return;
    }
    await applyDataChange(() => postRideData("/api/simulation/clear", {}));
    setView("simulation");
  }

  return (
    <DemoPasswordGate>
      <AppShell
      role={role}
      view={view}
      masked={masked}
      serviceDate={data.serviceDate}
      weather={data.weather}
      onRoleChange={(nextRole) => {
        setRole(nextRole);
        if (nextRole === "driver") {
          setView("driver");
        } else if (nextRole === "facility") {
          setView("progress");
        } else {
          setView("dashboard");
        }
      }}
      onViewChange={setView}
      onMaskedChange={setMasked}
    >
      {loading ? <div className="empty">DBから読み込み中です。</div> : null}
      {errorMessage ? <div className="notice">{errorMessage}</div> : null}
      {["plan", "driver", "progress", "results", "export"].includes(view) ? (
        <PlanSelector data={data} selectedPlanId={activePlan?.id} onSelectPlan={setSelectedPlanId} />
      ) : null}
      {view === "simulation" ? (
        <SimulationPanel
          data={data}
          busy={simulationBusy}
          onLoadScenario={handleLoadSimulation}
          onClearData={() => void handleClearDemoData()}
          onGoToPlan={() => setView("plan")}
          onGoToDriver={() => {
            setRole("driver");
            setView("driver");
          }}
          onGoToProgress={() => {
            setRole("facility");
            setView("progress");
          }}
          onGoToResults={() => setView("results")}
        />
      ) : null}
      {view === "masters" ? (
        <MasterManagement
          data={data}
          onAddUser={handleAddUser}
          onAddVehicle={handleAddVehicle}
          onAddStaff={handleAddStaff}
          onUpdateUser={handleUpdateUser}
          onUpdateVehicle={handleUpdateVehicle}
          onUpdateStaff={handleUpdateStaff}
          onDeleteUser={(user) => handleDeleteUser(user.id, user.name)}
          onDeleteVehicle={(vehicle) => handleDeleteVehicle(vehicle.id, vehicle.name)}
          onDeleteStaff={(staff) => handleDeleteStaff(staff.id, staff.name)}
        />
      ) : null}
      {view === "planner" ? (
        <RidePlanEditor
          data={data}
          onCreatePlan={handleCreatePlan}
          onAddStop={handleAddStop}
        />
      ) : null}
      {view === "export" ? (
        <ExportPanel data={data} />
      ) : null}
      {view === "dashboard" || view === "progress" ? (
        <Dashboard
          data={data}
          masked={masked}
          readonly={view === "progress"}
          onNavigateToDriver={() => {
            setRole("driver");
            setView("driver");
          }}
        />
      ) : null}
      {view === "plan" ? (
        <RideStopTable
          data={data}
          masked={masked}
          selectedPlanId={activePlan?.id}
          onSkip={(stop) => handleRideEvent(stop, "skip", "デモ操作でキャンセル")}
          onUpdate={(stop) => void updateStop(stop)}
          onMove={(stop, direction) => void moveStop(stop, direction)}
          onDelete={(stop) => void deleteStop(stop)}
        />
      ) : null}
      {view === "driver" ? (
        <DriverView
          plan={activePlan}
          stops={activeStops}
          data={data}
          masked={masked}
          onEvent={handleRideEvent}
          onUndo={handleUndo}
        />
      ) : null}
      {view === "results" ? (
        <ResultsTable data={data} masked={masked} />
      ) : null}
      </AppShell>
    </DemoPasswordGate>
  );
}
