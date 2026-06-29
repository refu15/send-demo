import type {
  RideImportResult,
  RidePeriod,
  RidePlan,
  RideStop,
  Staff,
  StaffRole,
  User,
  Vehicle,
} from "@/lib/ride/types";

export type UserInput = Pick<
  User,
  | "id"
  | "name"
  | "gender"
  | "servicePattern"
  | "phone"
  | "address"
  | "wheelchairRequired"
  | "medicineCheckRequired"
  | "note"
>;

export type VehicleInput = Pick<Vehicle, "id" | "name" | "capacity" | "note">;

export type StaffInput = {
  id: string;
  name: string;
  role: StaffRole;
  qualification?: string;
};

export type RidePlanInput = {
  id: string;
  serviceDate?: string;
  weekday?: string;
  period: RidePeriod;
  vehicleId?: string;
  driverId?: string;
  attendantId?: string;
  weather?: string;
};

export type RideStopInput = {
  id: string;
  ridePlanId: string;
  userId: string;
  scheduledTime?: string;
  note?: string;
};

export function createEmptyRideData(): RideImportResult {
  return {
    users: [],
    vehicles: [],
    staff: [],
    ridePlans: [],
    rideStops: [],
    errors: [],
    warnings: [],
  };
}

export function addUser(data: RideImportResult, input: UserInput): RideImportResult {
  assertUnique(data.users, input.id, "User");

  const user: User = {
    ...input,
    name: requiredText(input.name, "User name"),
    wheelchairRequired: input.wheelchairRequired,
    medicineCheckRequired: input.medicineCheckRequired,
  };

  return { ...data, users: [...data.users, user] };
}

export function addVehicle(data: RideImportResult, input: VehicleInput): RideImportResult {
  assertUnique(data.vehicles, input.id, "Vehicle");

  const vehicle: Vehicle = {
    ...input,
    name: requiredText(input.name, "Vehicle name"),
  };

  return { ...data, vehicles: [...data.vehicles, vehicle] };
}

export function addStaff(data: RideImportResult, input: StaffInput): RideImportResult {
  assertUnique(data.staff, input.id, "Staff");

  const staff: Staff = {
    ...input,
    name: requiredText(input.name, "Staff name"),
  };

  return { ...data, staff: [...data.staff, staff] };
}

export function createRidePlan(
  data: RideImportResult,
  input: RidePlanInput,
): RideImportResult {
  assertUnique(data.ridePlans, input.id, "Ride plan");

  const plan: RidePlan = {
    ...input,
    status: "draft",
  };

  return {
    ...data,
    serviceDate: input.serviceDate ?? data.serviceDate,
    weekday: input.weekday ?? data.weekday,
    weather: input.weather ?? data.weather,
    ridePlans: [...data.ridePlans, plan],
  };
}

export function addRideStop(data: RideImportResult, input: RideStopInput): RideImportResult {
  assertUnique(data.rideStops, input.id, "Ride stop");

  const plan = data.ridePlans.find((item) => item.id === input.ridePlanId);
  if (!plan) {
    throw new Error("Ride plan not found");
  }

  const user = data.users.find((item) => item.id === input.userId);
  if (!user) {
    throw new Error("User not found");
  }

  const nextOrder =
    Math.max(
      0,
      ...data.rideStops
        .filter((stop) => stop.ridePlanId === plan.id)
        .map((stop) => stop.order),
    ) + 1;

  const stop: RideStop = {
    id: input.id,
    ridePlanId: plan.id,
    userId: user.id,
    order: nextOrder,
    scheduledTime: input.scheduledTime,
    address: user.address,
    phone: user.phone,
    note: input.note,
    status: "planned",
    events: [],
  };

  return { ...data, rideStops: [...data.rideStops, stop] };
}

function assertUnique(items: Array<{ id: string }>, id: string, label: string) {
  if (items.some((item) => item.id === id)) {
    throw new Error(`${label} already exists`);
  }
}

function requiredText(value: string, label: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${label} is required`);
  }
  return trimmed;
}
