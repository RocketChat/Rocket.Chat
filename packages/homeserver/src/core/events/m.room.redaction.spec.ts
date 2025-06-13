import { expect, test } from "bun:test";

import { generateId } from "../../authentication";
import { generateKeyPairsFromString } from "../../keys";
import { signEvent } from "../../signEvent";
import { isRedactionEvent, redactionEvent } from "./m.room.redaction";
import type { EventBase } from "./eventBase";

test("isRedactionEvent", () => {
    // Test case 1: Should return true for a redaction event
    const redactionEventObj = {
        type: "m.room.redaction",
        content: {},
        room_id: "!someroom:example.org",
        sender: "@user:example.org",
        origin_server_ts: 1622000000000,
        auth_events: [],
        prev_events: [],
        depth: 1,
        origin: "example.org"
    };
    expect(isRedactionEvent(redactionEventObj)).toBe(true);

    // Test case 2: Should return false for non-redaction events
    const nonRedactionEvent = {
        type: "m.room.message",
        content: {
            body: "Hello world",
            msgtype: "m.text",
        },
        room_id: "!someroom:example.org",
        sender: "@user:example.org",
        origin_server_ts: 1622000000000,
        auth_events: [],
        prev_events: [],
        depth: 1,
        origin: "example.org"
    };
    expect(isRedactionEvent(nonRedactionEvent)).toBe(false);    // Test case 3: Should return false for events with undefined type
    const undefinedTypeEvent = {
        content: {},
        room_id: "!someroom:example.org",
        sender: "@user:example.org",
        origin_server_ts: 1622000000000,
        auth_events: [],
        prev_events: [],
        depth: 1,
        origin: "example.org"
    } as unknown as EventBase;
    expect(isRedactionEvent(undefinedTypeEvent)).toBe(false);

    // Test case 4: Should return false for null or undefined events
    expect(isRedactionEvent(null as unknown as EventBase)).toBe(false);
    expect(isRedactionEvent(undefined as unknown as EventBase)).toBe(false);
});

test("redactionEvent", async () => {
    const signature = await generateKeyPairsFromString(
        "ed25519 a_HDhg WntaJ4JP5WbZZjDShjeuwqCybQ5huaZAiowji7tnIEw",
    );

    const { state_key: redactionStateKey, ...redaction } = redactionEvent({
        roomId: "!MZyyuzkUwHEaBBOXai:hs1",
        sender: "@user:rc1",
        auth_events: {
            "m.room.create": "$lBxmA2J-6fGfOjUZ6dPCanOdBdkawli08Jf1IuH8aso",
            "m.room.power_levels": "$mxzNPfcqEDUUuWm7xs44NguWJ3A2nWu6UxXt4TlX-T8",
            "m.room.member": "$TK2UQZ-AEsSoIIRoTKYBTf9c1wW8X3AmjLhnuiSnDmY",
        },
        prev_events: ["$8ftnUd9WTPTQGbdPgfOPea8bOEQ21qPvbcGqeOApQxA"],
        depth: 4,
        content: {
            redacts: "$8ftnUd9WTPTQGbdPgfOPea8bOEQ21qPvbcGqeOApQxA",
            reason: "Inappropriate content"
        },
        origin: "rc1",
        ts: 1747837631863,
    });

    // Verify that the redacts property is in the original event
    expect(redaction.redacts).toBe("$8ftnUd9WTPTQGbdPgfOPea8bOEQ21qPvbcGqeOApQxA");

    const signedRedaction = await signEvent(redaction, signature, "rc1");
    const redactionEventId = generateId(signedRedaction);

    // Verify basic event structure after signing
    expect(signedRedaction.type).toBe("m.room.redaction");
    expect(signedRedaction.content.reason).toBe("Inappropriate content");
    expect(signedRedaction.room_id).toBe("!MZyyuzkUwHEaBBOXai:hs1");
    expect(signedRedaction.sender).toBe("@user:rc1");
    expect(redactionEventId).toBeDefined();
});
