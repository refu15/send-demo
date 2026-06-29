import { NextResponse } from "next/server";
import { assertJsonObject } from "@/lib/api/validation";
import { prisma } from "@/lib/db/client";
import { deleteRideStopRecord, readRideData, updateRideStopRecord } from "@/lib/db/ride-repository";
import type { RideStop } from "@/lib/ride/types";

export const runtime = "nodejs";
export const dynamic = "force-static";

export function generateStaticParams() {
  return [];
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = assertJsonObject(await request.json()) as Partial<RideStop>;
    if (body.id !== id) {
      throw new Error("Ride stop id mismatch");
    }
    if (!body.ridePlanId || !body.userId || typeof body.order !== "number" || !body.status) {
      throw new Error("Ride stop payload is invalid");
    }
    await updateRideStopRecord(prisma, body as RideStop);
    return NextResponse.json(await readRideData(prisma));
  } catch (error) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: error instanceof Error ? error.message : "Invalid request" } },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    return NextResponse.json(await deleteRideStopRecord(prisma, id));
  } catch (error) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: error instanceof Error ? error.message : "Invalid request" } },
      { status: 400 },
    );
  }
}
