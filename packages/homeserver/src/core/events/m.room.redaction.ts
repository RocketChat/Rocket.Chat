import { createEventBase, type EventBase } from "./eventBase";
import { createEventWithId } from "./utils/createSignedEvent";

declare module "./eventBase" {
    interface Events {
        "m.room.redaction": RedactionEvent;
    }
}

export type RedactionAuthEvents = {
    "m.room.create": string | undefined;
    "m.room.power_levels": string | undefined;
    "m.room.member"?: string | undefined;
}

export const isRedactionEvent = (
    event: EventBase,
): event is RedactionEvent => {
    return event?.type === "m.room.redaction";
};

export interface RedactionEvent extends EventBase {
    content: {
        reason?: string;
    };
    unsigned: {
        age_ts: number;
    };
    redacts: string;
}

const isTruthy = <T>(value: T | null | undefined | false | 0 | ''): value is T => {
    return Boolean(value);
};

export const redactionEvent = ({
    roomId,
    sender,
    auth_events,
    prev_events,
    depth,
    content,
    origin,
    ts = Date.now(),
    unsigned,
}: {
    roomId: string;
    sender: string;
    auth_events: RedactionAuthEvents;
    prev_events: string[];
    depth: number;
    content: {
        redacts: string;
        reason?: string;
    };
    origin?: string;
    ts?: number;
    unsigned?: { age_ts?: number };
}): RedactionEvent => {
    // Extract redacts from content - it must be at top level only
    const { redacts } = content;
    const { reason } = content;

    const baseEvent = createEventBase("m.room.redaction", {
        roomId,
        sender,
        auth_events: [
            auth_events["m.room.create"],
            auth_events["m.room.power_levels"],
            auth_events["m.room.member"]
        ].filter(isTruthy),
        prev_events,
        depth,
        content: {
            ...(reason ? { reason } : {})
        },
        origin_server_ts: ts,
        ts,
        origin,
        unsigned: { ...unsigned, age_ts: ts },
    });

    return {
        ...baseEvent,
        redacts,
    };
};

export const createRedactionEvent = createEventWithId(redactionEvent);
