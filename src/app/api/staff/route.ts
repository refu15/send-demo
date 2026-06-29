import { NextResponse } from "next/server";
import { createApiId, assertJsonObject, optionalString, requiredString } from "@/lib/api/validation";
import { prisma } from "@/lib/db/client";
import { createStaffRecord, readRideData } from "@/lib/db/ride-repository";
import type { StaffRole } from "@/lib/ride/types";

export const runtime = "nodejs";
export const dynamic = "force-static";

const staffRoles = new Set<StaffRole>(["driver", "attendant", "care", "nurse", "manager"]);

export async function POST(request: Request) {
  try {
    const body = assertJsonObject(await request.json());
    const role = requiredString(body, "role") as StaffRole;
    if (!staffRoles.has(role)) {
      throw new Error("role is invalid");
    }
    await createStaffRecord(prisma, {
      id: createApiId("staff"),
      name: requiredString(body, "name"),
      role,
      qualification: optionalString(body, "qualification"),
    });
    return NextResponse.json(await readRideData(prisma), { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: error instanceof Error ? error.message : "Invalid request" } },
      { status: 400 },
    );
  }
}
