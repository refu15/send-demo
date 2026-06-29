import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { replaceRideData } from "@/lib/db/ride-repository";
import { createFieldSimulationData } from "@/lib/simulation/scenario";

export const runtime = "nodejs";
export const dynamic = "force-static";

export async function POST() {
  return NextResponse.json(await replaceRideData(prisma, createFieldSimulationData()), {
    status: 201,
  });
}
