export type RidePeriod = "AM" | "PM";

export type StaffRole = "driver" | "attendant" | "care" | "nurse" | "manager";

export type ActorRole = "admin" | "facility" | "driver";

export type RideStopStatus =
  | "planned"
  | "skipped"
  | "arrived"
  | "boarded"
  | "departed"
  | "completed";

export type RideEventType = "skip" | "arrive" | "board" | "depart" | "complete";

export type User = {
  id: string;
  name: string;
  gender?: string;
  servicePattern?: string;
  phone?: string;
  address?: string;
  wheelchairRequired: boolean;
  medicineCheckRequired: boolean;
  note?: string;
};

export type Vehicle = {
  id: string;
  name: string;
  capacity?: number;
  note?: string;
};

export type Staff = {
  id: string;
  name: string;
  role: StaffRole;
  qualification?: string;
};

export type RidePlan = {
  id: string;
  serviceDate?: string;
  weekday?: string;
  period: RidePeriod;
  vehicleId?: string;
  driverId?: string;
  attendantId?: string;
  weather?: string;
  status: "draft" | "ready" | "in_progress" | "completed";
};

export type RideActual = {
  arrivedAt?: string;
  boardedAt?: string;
  departedAt?: string;
  completedAt?: string;
  skippedAt?: string;
};

export type RideEvent = {
  id: string;
  rideStopId: string;
  eventType: RideEventType;
  occurredAt: string;
  actorRole: ActorRole;
  actorName: string;
  note?: string;
};

export type RideStop = {
  id: string;
  ridePlanId: string;
  userId: string;
  order: number;
  scheduledTime?: string;
  address?: string;
  phone?: string;
  note?: string;
  status: RideStopStatus;
  canceledReason?: string;
  actual?: RideActual;
  events: RideEvent[];
};

export type ImportError = {
  code: string;
  message: string;
  sheet?: string;
  row?: number;
  column?: string;
};

export type RideImportResult = {
  serviceDate?: string;
  weekday?: string;
  weather?: string;
  users: User[];
  vehicles: Vehicle[];
  staff: Staff[];
  ridePlans: RidePlan[];
  rideStops: RideStop[];
  errors: ImportError[];
  warnings: ImportError[];
};
