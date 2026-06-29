import { NextResponse } from "next/server";
import { createApiId, assertJsonObject, optionalString, requiredString } from "@/lib/api/validation";
import { prisma } from "@/lib/db/client";
import { createRidePlanRecord, readRideData } from "@/lib/db/ride-repository";
import type { RidePeriod } from "@/lib/ride/types";

export const runtime = "nodejs";
export const dynamic = "force-static";

export async function POST(request: Request) {
  try {
    const body = assertJsonObject(await request.json());
    const period = requiredString(body, "period") as RidePeriod;
    if (period !== "AM" && period !== "PM") {
      throw new Error("period is invalid");
    }
    await createRidePlanRecord(prisma, {
      id: createApiId("plan"),
      serviceDate: optionalString(body, "serviceDate"),
      weekday: optionalString(body, "weekday"),
      period,
      vehicleId: optionalString(body, "vehicleId"),
      driverId: optionalString(body, "driverId"),
      attendantId: optionalString(body, "attendantId"),
      weather: optionalString(body, "weather"),
    });
    return NextResponse.json(await readRideData(prisma), { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: error instanceof Error ? error.message : "Invalid request" } },
      { status: 400 },
    );
  }
}
