import { NextResponse } from "next/server";
import { createApiId, assertJsonObject, optionalNumber, optionalString, requiredString } from "@/lib/api/validation";
import { prisma } from "@/lib/db/client";
import { createVehicleRecord, readRideData } from "@/lib/db/ride-repository";

export const runtime = "nodejs";
export const dynamic = "force-static";

export async function POST(request: Request) {
  try {
    const body = assertJsonObject(await request.json());
    await createVehicleRecord(prisma, {
      id: createApiId("vehicle"),
      name: requiredString(body, "name"),
      capacity: optionalNumber(body, "capacity"),
      note: optionalString(body, "note"),
    });
    return NextResponse.json(await readRideData(prisma), { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: error instanceof Error ? error.message : "Invalid request" } },
      { status: 400 },
    );
  }
}
