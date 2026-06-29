import { NextResponse } from "next/server";
import { assertJsonObject, requiredString } from "@/lib/api/validation";
import { prisma } from "@/lib/db/client";
import { moveRideStopRecord } from "@/lib/db/ride-repository";

export const runtime = "nodejs";
export const dynamic = "force-static";

export function generateStaticParams() {
  return [];
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = assertJsonObject(await request.json());
    const direction = requiredString(body, "direction");
    if (direction !== "up" && direction !== "down") {
      throw new Error("direction is invalid");
    }
    return NextResponse.json(await moveRideStopRecord(prisma, id, direction));
  } catch (error) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: error instanceof Error ? error.message : "Invalid request" } },
      { status: 400 },
    );
  }
}
