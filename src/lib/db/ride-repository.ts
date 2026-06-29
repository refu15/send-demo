import type { PrismaClient } from "@prisma/client";
import type {
  RideEvent,
  RideImportResult,
  RidePlan,
  RideStop,
  Staff,
  User,
  Vehicle,
} from "@/lib/ride/types";
import type {
  RidePlanInput,
  RideStopInput,
  StaffInput,
  UserInput,
  VehicleInput,
} from "@/lib/ride/app-state";

type DbClient = PrismaClient;

export async function readRideData(db: DbClient): Promise<RideImportResult> {
  const [users, vehicles, staff, ridePlans, rideStops] = await Promise.all([
    db.user.findMany({ orderBy: { createdAt: "asc" } }),
    db.vehicle.findMany({ orderBy: { createdAt: "asc" } }),
    db.staff.findMany({ orderBy: { createdAt: "asc" } }),
    db.ridePlan.findMany({ orderBy: [{ serviceDate: "asc" }, { period: "asc" }, { createdAt: "asc" }] }),
    db.rideStop.findMany({
      include: { events: { orderBy: { createdAt: "asc" } } },
      orderBy: [{ ridePlanId: "asc" }, { order: "asc" }],
    }),
  ]);

  const firstPlan = ridePlans[0];

  return {
    serviceDate: firstPlan?.serviceDate ?? undefined,
    weekday: firstPlan?.weekday ?? undefined,
    weather: firstPlan?.weather ?? undefined,
    users: users.map(toUser),
    vehicles: vehicles.map(toVehicle),
    staff: staff.map(toStaff),
    ridePlans: ridePlans.map(toRidePlan),
    rideStops: rideStops.map(toRideStop),
    errors: [],
    warnings: [],
  };
}

export async function createUserRecord(db: DbClient, input: UserInput): Promise<User> {
  return toUser(
    await db.user.create({
      data: input,
    }),
  );
}

export async function createVehicleRecord(db: DbClient, input: VehicleInput): Promise<Vehicle> {
  return toVehicle(
    await db.vehicle.create({
      data: input,
    }),
  );
}

export async function createStaffRecord(db: DbClient, input: StaffInput): Promise<Staff> {
  return toStaff(
    await db.staff.create({
      data: input,
    }),
  );
}

export async function updateUserRecord(
  db: DbClient,
  id: string,
  input: Omit<UserInput, "id">,
): Promise<User> {
  return toUser(
    await db.user.update({
      where: { id },
      data: input,
    }),
  );
}

export async function updateVehicleRecord(
  db: DbClient,
  id: string,
  input: Omit<VehicleInput, "id">,
): Promise<Vehicle> {
  return toVehicle(
    await db.vehicle.update({
      where: { id },
      data: input,
    }),
  );
}

export async function updateStaffRecord(
  db: DbClient,
  id: string,
  input: Omit<StaffInput, "id">,
): Promise<Staff> {
  return toStaff(
    await db.staff.update({
      where: { id },
      data: input,
    }),
  );
}

export async function deleteUserRecord(db: DbClient, id: string): Promise<RideImportResult> {
  const rideStopCount = await db.rideStop.count({ where: { userId: id } });
  if (rideStopCount > 0) {
    throw new Error("User is used by ride stops");
  }

  await db.user.delete({ where: { id } });
  return readRideData(db);
}

export async function deleteVehicleRecord(db: DbClient, id: string): Promise<RideImportResult> {
  const ridePlanCount = await db.ridePlan.count({ where: { vehicleId: id } });
  if (ridePlanCount > 0) {
    throw new Error("Vehicle is used by ride plans");
  }

  await db.vehicle.delete({ where: { id } });
  return readRideData(db);
}

export async function deleteStaffRecord(db: DbClient, id: string): Promise<RideImportResult> {
  const ridePlanCount = await db.ridePlan.count({
    where: { OR: [{ driverId: id }, { attendantId: id }] },
  });
  if (ridePlanCount > 0) {
    throw new Error("Staff is used by ride plans");
  }

  await db.staff.delete({ where: { id } });
  return readRideData(db);
}

export async function createRidePlanRecord(
  db: DbClient,
  input: RidePlanInput,
): Promise<RidePlan> {
  return toRidePlan(
    await db.ridePlan.create({
      data: {
        ...input,
        status: "draft",
      },
    }),
  );
}

export async function createRideStopRecord(
  db: DbClient,
  input: RideStopInput,
): Promise<RideStop> {
  return db.$transaction(async (tx) => {
    const [plan, user, lastStop] = await Promise.all([
      tx.ridePlan.findUnique({ where: { id: input.ridePlanId } }),
      tx.user.findUnique({ where: { id: input.userId } }),
      tx.rideStop.findFirst({
        where: { ridePlanId: input.ridePlanId },
        orderBy: { order: "desc" },
      }),
    ]);

    if (!plan) {
      throw new Error("Ride plan not found");
    }
    if (!user) {
      throw new Error("User not found");
    }

    return toRideStop(
      await tx.rideStop.create({
        data: {
          id: input.id,
          ridePlanId: plan.id,
          userId: user.id,
          order: (lastStop?.order ?? 0) + 1,
          scheduledTime: input.scheduledTime,
          address: user.address,
          phone: user.phone,
          note: input.note,
          status: "planned",
        },
        include: { events: true },
      }),
    );
  });
}

export async function updateRideStopRecord(db: DbClient, input: RideStop): Promise<RideStop> {
  return toRideStop(
    await db.$transaction(async (tx) => {
      await tx.rideEvent.deleteMany({ where: { rideStopId: input.id } });
      return tx.rideStop.update({
        where: { id: input.id },
        data: {
          order: input.order,
          scheduledTime: input.scheduledTime,
          address: input.address,
          phone: input.phone,
          note: input.note,
          status: input.status,
          canceledReason: input.canceledReason,
          arrivedAt: input.actual?.arrivedAt,
          boardedAt: input.actual?.boardedAt,
          departedAt: input.actual?.departedAt,
          completedAt: input.actual?.completedAt,
          skippedAt: input.actual?.skippedAt,
          events: {
            create: input.events.map((event) => ({
              id: event.id,
              eventType: event.eventType,
              occurredAt: event.occurredAt,
              actorRole: event.actorRole,
              actorName: event.actorName,
              note: event.note,
            })),
          },
        },
        include: { events: { orderBy: { createdAt: "asc" } } },
      });
    }),
  );
}

export async function moveRideStopRecord(
  db: DbClient,
  stopId: string,
  direction: "up" | "down",
): Promise<RideImportResult> {
  await db.$transaction(async (tx) => {
    const current = await tx.rideStop.findUnique({ where: { id: stopId } });
    if (!current) {
      throw new Error("Ride stop not found");
    }

    const adjacent = await tx.rideStop.findFirst({
      where: {
        ridePlanId: current.ridePlanId,
        order: direction === "up" ? { lt: current.order } : { gt: current.order },
      },
      orderBy: { order: direction === "up" ? "desc" : "asc" },
    });

    if (!adjacent) {
      return;
    }

    await tx.rideStop.update({
      where: { id: current.id },
      data: { order: adjacent.order },
    });
    await tx.rideStop.update({
      where: { id: adjacent.id },
      data: { order: current.order },
    });
  });

  return readRideData(db);
}

export async function deleteRideStopRecord(db: DbClient, stopId: string): Promise<RideImportResult> {
  await db.$transaction(async (tx) => {
    const current = await tx.rideStop.findUnique({ where: { id: stopId } });
    if (!current) {
      throw new Error("Ride stop not found");
    }

    await tx.rideStop.delete({ where: { id: stopId } });
    const remainingStops = await tx.rideStop.findMany({
      where: { ridePlanId: current.ridePlanId },
      orderBy: { order: "asc" },
    });

    for (const [index, stop] of remainingStops.entries()) {
      await tx.rideStop.update({
        where: { id: stop.id },
        data: { order: index + 1 },
      });
    }
  });

  return readRideData(db);
}

export async function clearRideData(db: DbClient): Promise<RideImportResult> {
  await db.$transaction(async (tx) => {
    await tx.rideEvent.deleteMany();
    await tx.rideStop.deleteMany();
    await tx.ridePlan.deleteMany();
    await tx.user.deleteMany();
    await tx.vehicle.deleteMany();
    await tx.staff.deleteMany();
  });

  return readRideData(db);
}

export async function replaceRideData(
  db: DbClient,
  data: RideImportResult,
): Promise<RideImportResult> {
  await db.$transaction(async (tx) => {
    await tx.rideEvent.deleteMany();
    await tx.rideStop.deleteMany();
    await tx.ridePlan.deleteMany();
    await tx.user.deleteMany();
    await tx.vehicle.deleteMany();
    await tx.staff.deleteMany();

    await tx.user.createMany({ data: data.users });
    await tx.vehicle.createMany({ data: data.vehicles });
    await tx.staff.createMany({ data: data.staff });
    await tx.ridePlan.createMany({
      data: data.ridePlans.map((plan) => ({
        id: plan.id,
        serviceDate: plan.serviceDate,
        weekday: plan.weekday,
        period: plan.period,
        vehicleId: plan.vehicleId,
        driverId: plan.driverId,
        attendantId: plan.attendantId,
        weather: plan.weather,
        status: plan.status,
      })),
    });

    for (const stop of data.rideStops) {
      await tx.rideStop.create({
        data: {
          id: stop.id,
          ridePlanId: stop.ridePlanId,
          userId: stop.userId,
          order: stop.order,
          scheduledTime: stop.scheduledTime,
          address: stop.address,
          phone: stop.phone,
          note: stop.note,
          status: stop.status,
          canceledReason: stop.canceledReason,
          arrivedAt: stop.actual?.arrivedAt,
          boardedAt: stop.actual?.boardedAt,
          departedAt: stop.actual?.departedAt,
          completedAt: stop.actual?.completedAt,
          skippedAt: stop.actual?.skippedAt,
          events: {
            create: stop.events.map((event) => ({
              id: event.id,
              eventType: event.eventType,
              occurredAt: event.occurredAt,
              actorRole: event.actorRole,
              actorName: event.actorName,
              note: event.note,
            })),
          },
        },
      });
    }
  });

  return readRideData(db);
}

function toUser(record: {
  id: string;
  name: string;
  gender: string | null;
  servicePattern: string | null;
  phone: string | null;
  address: string | null;
  wheelchairRequired: boolean;
  medicineCheckRequired: boolean;
  note: string | null;
}): User {
  return {
    id: record.id,
    name: record.name,
    gender: record.gender ?? undefined,
    servicePattern: record.servicePattern ?? undefined,
    phone: record.phone ?? undefined,
    address: record.address ?? undefined,
    wheelchairRequired: record.wheelchairRequired,
    medicineCheckRequired: record.medicineCheckRequired,
    note: record.note ?? undefined,
  };
}

function toVehicle(record: {
  id: string;
  name: string;
  capacity: number | null;
  note: string | null;
}): Vehicle {
  return {
    id: record.id,
    name: record.name,
    capacity: record.capacity ?? undefined,
    note: record.note ?? undefined,
  };
}

function toStaff(record: {
  id: string;
  name: string;
  role: string;
  qualification: string | null;
}): Staff {
  return {
    id: record.id,
    name: record.name,
    role: record.role as Staff["role"],
    qualification: record.qualification ?? undefined,
  };
}

function toRidePlan(record: {
  id: string;
  serviceDate: string | null;
  weekday: string | null;
  period: string;
  vehicleId: string | null;
  driverId: string | null;
  attendantId: string | null;
  weather: string | null;
  status: string;
}): RidePlan {
  return {
    id: record.id,
    serviceDate: record.serviceDate ?? undefined,
    weekday: record.weekday ?? undefined,
    period: record.period as RidePlan["period"],
    vehicleId: record.vehicleId ?? undefined,
    driverId: record.driverId ?? undefined,
    attendantId: record.attendantId ?? undefined,
    weather: record.weather ?? undefined,
    status: record.status as RidePlan["status"],
  };
}

function toRideStop(record: {
  id: string;
  ridePlanId: string;
  userId: string;
  order: number;
  scheduledTime: string | null;
  address: string | null;
  phone: string | null;
  note: string | null;
  status: string;
  canceledReason: string | null;
  arrivedAt: string | null;
  boardedAt: string | null;
  departedAt: string | null;
  completedAt: string | null;
  skippedAt: string | null;
  events?: Array<{
    id: string;
    rideStopId: string;
    eventType: string;
    occurredAt: string;
    actorRole: string;
    actorName: string;
    note: string | null;
  }>;
}): RideStop {
  return {
    id: record.id,
    ridePlanId: record.ridePlanId,
    userId: record.userId,
    order: record.order,
    scheduledTime: record.scheduledTime ?? undefined,
    address: record.address ?? undefined,
    phone: record.phone ?? undefined,
    note: record.note ?? undefined,
    status: record.status as RideStop["status"],
    canceledReason: record.canceledReason ?? undefined,
    actual: {
      arrivedAt: record.arrivedAt ?? undefined,
      boardedAt: record.boardedAt ?? undefined,
      departedAt: record.departedAt ?? undefined,
      completedAt: record.completedAt ?? undefined,
      skippedAt: record.skippedAt ?? undefined,
    },
    events: record.events?.map(toRideEvent) ?? [],
  };
}

function toRideEvent(record: {
  id: string;
  rideStopId: string;
  eventType: string;
  occurredAt: string;
  actorRole: string;
  actorName: string;
  note: string | null;
}): RideEvent {
  return {
    id: record.id,
    rideStopId: record.rideStopId,
    eventType: record.eventType as RideEvent["eventType"],
    occurredAt: record.occurredAt,
    actorRole: record.actorRole as RideEvent["actorRole"],
    actorName: record.actorName,
    note: record.note ?? undefined,
  };
}
