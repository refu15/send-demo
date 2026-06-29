import {
  addRideStop,
  addStaff,
  addUser,
  addVehicle,
  createEmptyRideData,
  createRidePlan,
  type RidePlanInput,
  type RideStopInput,
  type StaffInput,
  type UserInput,
  type VehicleInput,
} from "@/lib/ride/app-state";
import type { RideImportResult, RideStop, Staff, User, Vehicle } from "@/lib/ride/types";

export type StaticMasterKind = "users" | "vehicles" | "staff";

export function createStaticRideData(): RideImportResult {
  return createEmptyRideData();
}

export function createStaticUser(data: RideImportResult, input: Omit<UserInput, "id">) {
  return addUser(data, { id: createStaticId("user"), ...input });
}

export function createStaticVehicle(data: RideImportResult, input: Omit<VehicleInput, "id">) {
  return addVehicle(data, { id: createStaticId("vehicle"), ...input });
}

export function createStaticStaff(data: RideImportResult, input: Omit<StaffInput, "id">) {
  return addStaff(data, { id: createStaticId("staff"), ...input });
}

export function createStaticRidePlan(data: RideImportResult, input: Omit<RidePlanInput, "id">) {
  return createRidePlan(data, { id: createStaticId("plan"), ...input });
}

export function createStaticRideStop(data: RideImportResult, input: Omit<RideStopInput, "id">) {
  return addRideStop(data, { id: createStaticId("stop"), ...input });
}

export function updateStaticRideStop(data: RideImportResult, updatedStop: RideStop) {
  return {
    ...data,
    rideStops: data.rideStops.map((stop) => (stop.id === updatedStop.id ? updatedStop : stop)),
  };
}

export function moveStaticRideStop(
  data: RideImportResult,
  stopId: string,
  direction: "up" | "down",
): RideImportResult {
  const current = data.rideStops.find((stop) => stop.id === stopId);
  if (!current) {
    throw new Error("Ride stop not found");
  }

  const planStops = data.rideStops
    .filter((stop) => stop.ridePlanId === current.ridePlanId)
    .sort((a, b) => a.order - b.order);
  const currentIndex = planStops.findIndex((stop) => stop.id === stopId);
  const adjacentIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  const adjacent = planStops[adjacentIndex];
  if (!adjacent) {
    return data;
  }

  return {
    ...data,
    rideStops: data.rideStops.map((stop) => {
      if (stop.id === current.id) {
        return { ...stop, order: adjacent.order };
      }
      if (stop.id === adjacent.id) {
        return { ...stop, order: current.order };
      }
      return stop;
    }),
  };
}

export function deleteStaticRideStop(data: RideImportResult, stopId: string): RideImportResult {
  const current = data.rideStops.find((stop) => stop.id === stopId);
  if (!current) {
    throw new Error("Ride stop not found");
  }

  const remainingStops = data.rideStops.filter((stop) => stop.id !== stopId);
  const renumberedPlanStops = remainingStops
    .filter((stop) => stop.ridePlanId === current.ridePlanId)
    .sort((a, b) => a.order - b.order)
    .map((stop, index) => ({ ...stop, order: index + 1 }));
  const renumberedById = new Map(renumberedPlanStops.map((stop) => [stop.id, stop]));

  return {
    ...data,
    rideStops: remainingStops.map((stop) => renumberedById.get(stop.id) ?? stop),
  };
}

export function updateStaticMaster(
  data: RideImportResult,
  kind: StaticMasterKind,
  id: string,
  input: Partial<User & Vehicle & Staff>,
): RideImportResult {
  if (kind === "users") {
    return updateStaticUser(data, id, input);
  }
  if (kind === "vehicles") {
    return {
      ...data,
      vehicles: data.vehicles.map((vehicle) =>
        vehicle.id === id ? { ...vehicle, ...normalizeVehicleInput(input) } : vehicle,
      ),
    };
  }
  return {
    ...data,
    staff: data.staff.map((staff) => (staff.id === id ? { ...staff, ...normalizeStaffInput(input) } : staff)),
  };
}

export function deleteStaticMaster(
  data: RideImportResult,
  kind: StaticMasterKind,
  id: string,
): RideImportResult {
  if (kind === "users") {
    if (data.rideStops.some((stop) => stop.userId === id)) {
      throw new Error("User is used by ride stops");
    }
    return { ...data, users: data.users.filter((user) => user.id !== id) };
  }

  if (kind === "vehicles") {
    if (data.ridePlans.some((plan) => plan.vehicleId === id)) {
      throw new Error("Vehicle is used by ride plans");
    }
    return { ...data, vehicles: data.vehicles.filter((vehicle) => vehicle.id !== id) };
  }

  if (data.ridePlans.some((plan) => plan.driverId === id || plan.attendantId === id)) {
    throw new Error("Staff is used by ride plans");
  }
  return { ...data, staff: data.staff.filter((staff) => staff.id !== id) };
}

function updateStaticUser(
  data: RideImportResult,
  id: string,
  input: Partial<User & Vehicle & Staff>,
): RideImportResult {
  const normalizedInput = normalizeUserInput(input);
  return {
    ...data,
    users: data.users.map((user) => (user.id === id ? { ...user, ...normalizedInput } : user)),
    rideStops: data.rideStops.map((stop) =>
      stop.userId === id
        ? {
            ...stop,
            address: normalizedInput.address ?? stop.address,
            phone: normalizedInput.phone ?? stop.phone,
          }
        : stop,
    ),
  };
}

function normalizeUserInput(input: Partial<User & Vehicle & Staff>): Partial<User> {
  return {
    name: input.name,
    gender: input.gender,
    servicePattern: input.servicePattern,
    phone: input.phone,
    address: input.address,
    wheelchairRequired: input.wheelchairRequired,
    medicineCheckRequired: input.medicineCheckRequired,
    note: input.note,
  };
}

function normalizeVehicleInput(input: Partial<User & Vehicle & Staff>): Partial<Vehicle> {
  return {
    name: input.name,
    capacity: input.capacity,
    note: input.note,
  };
}

function normalizeStaffInput(input: Partial<User & Vehicle & Staff>): Partial<Staff> {
  return {
    name: input.name,
    role: input.role,
    qualification: input.qualification,
  };
}

function createStaticId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
