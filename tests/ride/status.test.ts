import { describe, expect, it } from "vitest";
import {
  applyRideEvent,
  nextRideStopStatus,
  undoLastRideEvent,
} from "@/lib/ride/status";
import type { RideEvent, RideStop } from "@/lib/ride/types";

describe("nextRideStopStatus", () => {
  it("advances a stop through the normal pickup flow", () => {
    expect(nextRideStopStatus("planned", "arrive")).toBe("arrived");
    expect(nextRideStopStatus("arrived", "board")).toBe("boarded");
    expect(nextRideStopStatus("boarded", "depart")).toBe("departed");
    expect(nextRideStopStatus("departed", "complete")).toBe("completed");
  });

  it("allows a planned stop to be skipped", () => {
    expect(nextRideStopStatus("planned", "skip")).toBe("skipped");
  });

  it("rejects invalid transitions", () => {
    expect(() => nextRideStopStatus("planned", "complete")).toThrow(
      "Invalid ride stop transition",
    );
    expect(() => nextRideStopStatus("completed", "arrive")).toThrow(
      "Invalid ride stop transition",
    );
    expect(() => nextRideStopStatus("skipped", "depart")).toThrow(
      "Invalid ride stop transition",
    );
  });
});

describe("applyRideEvent", () => {
  it("records event timestamps without mutating the input stop", () => {
    const stop: RideStop = {
      id: "stop-1",
      ridePlanId: "plan-1",
      userId: "user-1",
      order: 1,
      scheduledTime: "09:00",
      address: "東京都サンプル区",
      phone: "090-0000-0000",
      note: "玄関前",
      status: "planned",
      events: [],
    };

    const event: RideEvent = {
      id: "event-1",
      rideStopId: "stop-1",
      eventType: "arrive",
      occurredAt: "2026-06-28T09:01:00.000Z",
      actorRole: "driver",
      actorName: "driver-demo",
    };

    const next = applyRideEvent(stop, event);

    expect(next.status).toBe("arrived");
    expect(next.actual.arrivedAt).toBe("2026-06-28T09:01:00.000Z");
    expect(next.events).toHaveLength(1);
    expect(stop.status).toBe("planned");
    expect(stop.events).toHaveLength(0);
  });
});

describe("undoLastRideEvent", () => {
  it("removes the last event and recalculates the stop status", () => {
    const stop: RideStop = {
      id: "stop-1",
      ridePlanId: "plan-1",
      userId: "user-1",
      order: 1,
      scheduledTime: "09:00",
      address: "東京都サンプル区",
      phone: "090-0000-0000",
      note: "玄関前",
      status: "boarded",
      actual: {
        arrivedAt: "2026-06-28T09:01:00.000Z",
        boardedAt: "2026-06-28T09:02:00.000Z",
      },
      events: [
        {
          id: "event-1",
          rideStopId: "stop-1",
          eventType: "arrive",
          occurredAt: "2026-06-28T09:01:00.000Z",
          actorRole: "driver",
          actorName: "driver-demo",
        },
        {
          id: "event-2",
          rideStopId: "stop-1",
          eventType: "board",
          occurredAt: "2026-06-28T09:02:00.000Z",
          actorRole: "driver",
          actorName: "driver-demo",
        },
      ],
    };

    const next = undoLastRideEvent(stop);

    expect(next.status).toBe("arrived");
    expect(next.actual.arrivedAt).toBe("2026-06-28T09:01:00.000Z");
    expect(next.actual.boardedAt).toBeUndefined();
    expect(next.events).toHaveLength(1);
  });
});
