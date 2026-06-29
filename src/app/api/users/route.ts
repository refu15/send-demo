import { NextResponse } from "next/server";
import { createApiId, assertJsonObject, booleanValue, optionalString, requiredString } from "@/lib/api/validation";
import { prisma } from "@/lib/db/client";
import { createUserRecord, readRideData } from "@/lib/db/ride-repository";

export const runtime = "nodejs";
export const dynamic = "force-static";

export async function POST(request: Request) {
  try {
    const body = assertJsonObject(await request.json());
    await createUserRecord(prisma, {
      id: createApiId("user"),
      name: requiredString(body, "name"),
      gender: optionalString(body, "gender"),
      servicePattern: optionalString(body, "servicePattern"),
      phone: optionalString(body, "phone"),
      address: optionalString(body, "address"),
      wheelchairRequired: booleanValue(body, "wheelchairRequired"),
      medicineCheckRequired: booleanValue(body, "medicineCheckRequired"),
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
