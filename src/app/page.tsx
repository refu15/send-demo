"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell, type Role } from "@/components/app-shell";
import { Dashboard } from "@/components/dashboard";
import { DemoPasswordGate } from "@/components/demo-password-gate";
import { DriverView } from "@/components/driver-view";
import { ExportPanel } from "@/components/export-panel";
import { MasterManagement } from "@/components/master-management";
import type {
  StaffFormInput,
  UserFormInput,
  VehicleFormInput,
} from "@/components/master-management";
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
      setErrorMessage(error instanceof Error ? error.message : "データの読み込みに失敗しました");
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
    if (window.confirm(`${name} を削除しますか。`)) {
      void applyDataChange(() => deleteRideData(`/api/users/${id}`));
    }
  }

  function handleDeleteVehicle(id: string, name: string) {
    if (window.confirm(`${name} を削除しますか。`)) {
      void applyDataChange(() => deleteRideData(`/api/vehicles/${id}`));
    }
  }

  function handleDeleteStaff(id: string, name: string) {
    if (window.confirm(`${name} を削除しますか。`)) {
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
  }

  function handleAddStop(input: {
    ridePlanId: string;
    userId: string;
    scheduledTime?: string;
    note?: string;
  }) {
    void applyDataChange(() => postRideData("/api/ride-stops", input));
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
    if (!window.confirm("デモ用の標準シナリオを読み込みます。よろしいですか。")) {
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
    if (!window.confirm("デモデータを消去します。よろしいですか。")) {
      return;
    }
    await applyDataChange(() => postRideData("/api/simulation/clear", {}));
  }

  function handleRoleChange(nextRole: Role) {
    setRole(nextRole);
  }

  return (
    <DemoPasswordGate role={role} onRoleChange={handleRoleChange}>
      <AppShell
        role={role}
        masked={masked}
        serviceDate={data.serviceDate}
        weather={data.weather}
        onMaskedChange={setMasked}
      >
        {loading ? <div className="empty">データを読み込み中です。</div> : null}
        {errorMessage ? <div className="notice">{errorMessage}</div> : null}
        {role === "admin" ? (
          <AdminWorkspace
            data={data}
            masked={masked}
            selectedPlanId={selectedPlanId}
            onSelectPlan={setSelectedPlanId}
            activePlanId={activePlan?.id}
            onLoadSimulation={handleLoadSimulation}
            onClearDemoData={handleClearDemoData}
            simulationBusy={simulationBusy}
            onAddUser={handleAddUser}
            onAddVehicle={handleAddVehicle}
            onAddStaff={handleAddStaff}
            onUpdateUser={handleUpdateUser}
            onUpdateVehicle={handleUpdateVehicle}
            onUpdateStaff={handleUpdateStaff}
            onDeleteUser={handleDeleteUser}
            onDeleteVehicle={handleDeleteVehicle}
            onDeleteStaff={handleDeleteStaff}
            onCreatePlan={handleCreatePlan}
            onAddStop={handleAddStop}
            onSkip={(stop) => handleRideEvent(stop, "skip", "キャンセル")}
            onUpdateStop={(stop) => void updateStop(stop)}
            onMoveStop={(stop, direction) => void moveStop(stop, direction)}
            onDeleteStop={(stop) => void deleteStop(stop)}
          />
        ) : null}
        {role === "facility" ? <Dashboard data={data} masked={masked} /> : null}
        {role === "driver" ? (
          <DriverWorkspace
            data={data}
            masked={masked}
            selectedPlanId={selectedPlanId}
            onSelectPlan={setSelectedPlanId}
            activePlanId={activePlan?.id}
            activeStops={activeStops}
            onEvent={handleRideEvent}
            onUndo={handleUndo}
          />
        ) : null}
      </AppShell>
    </DemoPasswordGate>
  );
}

function AdminWorkspace({
  data,
  masked,
  selectedPlanId,
  onSelectPlan,
  activePlanId,
  onLoadSimulation,
  onClearDemoData,
  simulationBusy,
  onAddUser,
  onAddVehicle,
  onAddStaff,
  onUpdateUser,
  onUpdateVehicle,
  onUpdateStaff,
  onDeleteUser,
  onDeleteVehicle,
  onDeleteStaff,
  onCreatePlan,
  onAddStop,
  onSkip,
  onUpdateStop,
  onMoveStop,
  onDeleteStop,
}: {
  data: RideImportResult;
  masked: boolean;
  selectedPlanId?: string;
  onSelectPlan: (planId: string) => void;
  activePlanId?: string;
  onLoadSimulation: () => void;
  onClearDemoData: () => void;
  simulationBusy: boolean;
  onAddUser: (input: UserFormInput) => void;
  onAddVehicle: (input: VehicleFormInput) => void;
  onAddStaff: (input: StaffFormInput) => void;
  onUpdateUser: (id: string, input: UserFormInput) => void;
  onUpdateVehicle: (id: string, input: VehicleFormInput) => void;
  onUpdateStaff: (id: string, input: StaffFormInput) => void;
  onDeleteUser: (id: string, name: string) => void;
  onDeleteVehicle: (id: string, name: string) => void;
  onDeleteStaff: (id: string, name: string) => void;
  onCreatePlan: (input: {
    serviceDate?: string;
    weekday?: string;
    period: RidePeriod;
    vehicleId?: string;
    driverId?: string;
    attendantId?: string;
    weather?: string;
  }) => void;
  onAddStop: (input: { ridePlanId: string; userId: string; scheduledTime?: string; note?: string }) => void;
  onSkip: (stop: RideStop) => void;
  onUpdateStop: (stop: RideStop) => void;
  onMoveStop: (stop: RideStop, direction: "up" | "down") => void;
  onDeleteStop: (stop: RideStop) => void;
}) {
  return (
    <>
      <SimulationPanel
        data={data}
        busy={simulationBusy}
        onLoadScenario={onLoadSimulation}
        onClearData={onClearDemoData}
      />
      <PlanSelector data={data} selectedPlanId={selectedPlanId} onSelectPlan={onSelectPlan} />
      <MasterManagement
        data={data}
        onAddUser={onAddUser}
        onAddVehicle={onAddVehicle}
        onAddStaff={onAddStaff}
        onUpdateUser={onUpdateUser}
        onUpdateVehicle={onUpdateVehicle}
        onUpdateStaff={onUpdateStaff}
        onDeleteUser={(user) => onDeleteUser(user.id, user.name)}
        onDeleteVehicle={(vehicle) => onDeleteVehicle(vehicle.id, vehicle.name)}
        onDeleteStaff={(staff) => onDeleteStaff(staff.id, staff.name)}
      />
      <RidePlanEditor data={data} onCreatePlan={onCreatePlan} onAddStop={onAddStop} />
      <RideStopTable
        data={data}
        masked={masked}
        selectedPlanId={activePlanId}
        onSkip={onSkip}
        onUpdate={onUpdateStop}
        onMove={onMoveStop}
        onDelete={onDeleteStop}
      />
      <ResultsTable data={data} masked={masked} />
      <ExportPanel data={data} />
    </>
  );
}

function DriverWorkspace({
  data,
  masked,
  selectedPlanId,
  onSelectPlan,
  activePlanId,
  activeStops,
  onEvent,
  onUndo,
}: {
  data: RideImportResult;
  masked: boolean;
  selectedPlanId?: string;
  onSelectPlan: (planId: string) => void;
  activePlanId?: string;
  activeStops: RideStop[];
  onEvent: (stop: RideStop, eventType: RideEvent["eventType"], note?: string) => void;
  onUndo: (stop: RideStop) => void;
}) {
  return (
    <>
      <PlanSelector data={data} selectedPlanId={selectedPlanId} onSelectPlan={onSelectPlan} />
      <DriverView
        plan={data.ridePlans.find((plan) => plan.id === activePlanId)}
        stops={activeStops}
        data={data}
        masked={masked}
        onEvent={onEvent}
        onUndo={onUndo}
      />
    </>
  );
}
