import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { readRideData } from "@/lib/db/ride-repository";
import { createFieldSimulationData } from "@/lib/simulation/scenario";

export const runtime = "nodejs";
export const dynamic = "force-static";

export async function GET() {
  if (process.env.NEXT_PUBLIC_STATIC_DEMO === "true") {
    return NextResponse.json(createFieldSimulationData());
  }
  return NextResponse.json(await readRideData(prisma));
}
