import { NextResponse } from "next/server";
import { assertJsonObject, booleanValue, optionalString, requiredString } from "@/lib/api/validation";
import { prisma } from "@/lib/db/client";
import { deleteUserRecord, readRideData, updateUserRecord } from "@/lib/db/ride-repository";

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
    await updateUserRecord(prisma, id, {
      name: requiredString(body, "name"),
      gender: optionalString(body, "gender"),
      servicePattern: optionalString(body, "servicePattern"),
      phone: optionalString(body, "phone"),
      address: optionalString(body, "address"),
      wheelchairRequired: booleanValue(body, "wheelchairRequired"),
      medicineCheckRequired: booleanValue(body, "medicineCheckRequired"),
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
    return NextResponse.json(await deleteUserRecord(prisma, id));
  } catch (error) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: error instanceof Error ? error.message : "Invalid request" } },
      { status: 400 },
    );
  }
}
