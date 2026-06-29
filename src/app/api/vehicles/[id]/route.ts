import { NextResponse } from "next/server";
import { assertJsonObject, optionalNumber, optionalString, requiredString } from "@/lib/api/validation";
import { prisma } from "@/lib/db/client";
import { deleteVehicleRecord, readRideData, updateVehicleRecord } from "@/lib/db/ride-repository";

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
    const body = assertJsonObject(await request.json());
    await updateVehicleRecord(prisma, id, {
      name: requiredString(body, "name"),
      capacity: optionalNumber(body, "capacity"),
      note: optionalString(body, "note"),
    });
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
    return NextResponse.json(await deleteVehicleRecord(prisma, id));
  } catch (error) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: error instanceof Error ? error.message : "Invalid request" } },
      { status: 400 },
    );
  }
}
