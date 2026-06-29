import type { RidePlan, RideStop, RideStopStatus } from "./types";

export type RideSummary = {
  planned: number;
  inProgress: number;
  completed: number;
  skipped: number;
  remaining: number;
  lastUpdatedAt?: string;
};

const inProgressStatuses: RideStopStatus[] = ["arrived", "boarded", "departed"];

export function summarizeRideStops(stops: RideStop[]): RideSummary {
  const completed = stops.filter((stop) => stop.status === "completed").length;
  const skipped = stops.filter((stop) => stop.status === "skipped").length;
  const planned = stops.filter((stop) => stop.status === "planned").length;
  const inProgress = stops.filter((stop) =>
    inProgressStatuses.includes(stop.status),
  ).length;
  const lastUpdatedAt = stops
    .flatMap((stop) => stop.events)
    .map((event) => event.occurredAt)
    .sort()
    .at(-1);

  return {
    planned,
    inProgress,
    completed,
    skipped,
    remaining: planned + inProgress,
    lastUpdatedAt,
  };
}

export function stopsForPlan(plan: RidePlan, stops: RideStop[]): RideStop[] {
  return stops
    .filter((stop) => stop.ridePlanId === plan.id)
    .sort((a, b) => a.order - b.order);
}
