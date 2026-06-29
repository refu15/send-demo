import { NextResponse } from "next/server";
import { assertJsonObject, optionalString, requiredString } from "@/lib/api/validation";
import { prisma } from "@/lib/db/client";
import { deleteStaffRecord, readRideData, updateStaffRecord } from "@/lib/db/ride-repository";
import type { StaffRole } from "@/lib/ride/types";

export const runtime = "nodejs";
export const dynamic = "force-static";

export function generateStaticParams() {
  return [];
}

const staffRoles = new Set<StaffRole>(["driver", "attendant", "care", "nurse", "manager"]);

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = assertJsonObject(await request.json());
    const role = requiredString(body, "role") as StaffRole;
    if (!staffRoles.has(role)) {
      throw new Error("role is invalid");
    }
    await updateStaffRecord(prisma, id, {
      name: requiredString(body, "name"),
      role,
      qualification: optionalString(body, "qualification"),
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
    return NextResponse.json(await deleteStaffRecord(prisma, id));
  } catch (error) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: error instanceof Error ? error.message : "Invalid request" } },
      { status: 400 },
    );
  }
}
