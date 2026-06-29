import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { clearRideData } from "@/lib/db/ride-repository";

export const runtime = "nodejs";
export const dynamic = "force-static";

export async function POST() {
  return NextResponse.json(await clearRideData(prisma));
}
