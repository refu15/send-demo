import { NextResponse } from "next/server";
import { createApiId, assertJsonObject, optionalString, requiredString } from "@/lib/api/validation";
import { prisma } from "@/lib/db/client";
import { createRideStopRecord, readRideData } from "@/lib/db/ride-repository";

export const runtime = "nodejs";
export const dynamic = "force-static";

export async function POST(request: Request) {
  try {
    const body = assertJsonObject(await request.json());
    await createRideStopRecord(prisma, {
      id: createApiId("stop"),
      ridePlanId: requiredString(body, "ridePlanId"),
      userId: requiredString(body, "userId"),
      scheduledTime: optionalString(body, "scheduledTime"),
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
