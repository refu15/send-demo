import type {
  RideActual,
  RideEvent,
  RideEventType,
  RideStop,
  RideStopStatus,
} from "./types";

const transitions: Record<
  RideStopStatus,
  Partial<Record<RideEventType, RideStopStatus>>
> = {
  planned: { arrive: "arrived", skip: "skipped" },
  skipped: {},
  arrived: { board: "boarded" },
  boarded: { depart: "departed" },
  departed: { complete: "completed" },
  completed: {},
};

export function nextRideStopStatus(
  current: RideStopStatus,
  eventType: RideEventType,
): RideStopStatus {
  const next = transitions[current][eventType];

  if (!next) {
    throw new Error(`Invalid ride stop transition: ${current} -> ${eventType}`);
  }

  return next;
}

export function applyRideEvent(stop: RideStop, event: RideEvent): RideStop {
  const status = nextRideStopStatus(stop.status, event.eventType);
  const actual = applyActualTime(stop.actual ?? {}, event);

  return {
    ...stop,
    status,
    actual,
    canceledReason: event.eventType === "skip" ? event.note : stop.canceledReason,
    events: [...stop.events, event],
  };
}

export function undoLastRideEvent(stop: RideStop): RideStop {
  const events = stop.events.slice(0, -1);
  return replayRideEvents({ ...stop, status: "planned", actual: {}, events: [] }, events);
}

function replayRideEvents(baseStop: RideStop, events: RideEvent[]): RideStop {
  return events.reduce((current, event) => applyRideEvent(current, event), baseStop);
}

function applyActualTime(actual: RideActual, event: RideEvent): RideActual {
  switch (event.eventType) {
    case "arrive":
      return { ...actual, arrivedAt: event.occurredAt };
    case "board":
      return { ...actual, boardedAt: event.occurredAt };
    case "depart":
      return { ...actual, departedAt: event.occurredAt };
    case "complete":
      return { ...actual, completedAt: event.occurredAt };
    case "skip":
      return { ...actual, skippedAt: event.occurredAt };
  }
}
