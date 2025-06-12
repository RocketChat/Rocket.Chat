import { describe, expect, test } from 'bun:test';

import { generateId } from '../../authentication';
import { generateKeyPairsFromString } from '../../keys';
import type { SignedEvent } from '../../signEvent';
import { signEvent } from '../../signEvent';
import { roomCreateEvent } from './m.room.create';
import { roomMemberEvent } from './m.room.member';
import { roomNameEvent, type RoomNameEvent } from './m.room.name';

const finalEventId = '$JdX_s3d4CORV_BfkatJxF_lUfzJoKjzQXTP0NGtVj1E';
const finalEventPlaceholder: SignedEvent<RoomNameEvent> = {
	event_id: finalEventId,
	auth_events: [
		'$lMg3qhNIzPMq4cPO2EqBJuHvTU6qtSmqaCTsdoiPvrM',
		'$placeholder_power_levels_event_id',
		'$H_5vgstCftSt9ZWVdwZ9-1oxiifxsYLx23iT_CGNke8',
	],
	prev_events: ['$H_5vgstCftSt9ZWVdwZ9-1oxiifxsYLx23iT_CGNke8'],
	type: 'm.room.name',
	room_id: '!MZyyuzkUwHEaBBOXai:hs1',
	sender: '@user1:rc1',
	depth: 3,
	origin: 'rc1',
	origin_server_ts: 1678886400000,
	content: {
		name: 'New Room Name',
	},
	state_key: '',
	hashes: {
		sha256: 'mGsU3AXkay3mIIQBUlvyycB9k1aZ136SllWOChEQ4qc',
	},
	unsigned: {
		age_ts: 1678886400000,
	},
	signatures: {
		rc1: {
			'ed25519:a_HDhg':
				'ZHKRV0W5bGYNdyP1CZ3PPjc/3ZC6DUOiEBtCpNwvh2aDnrNly7SxjjYHdkAi5+ZpZVB57o8AKsVuDoGnfV2cDQ',
		},
	},
};

describe('roomNameEvent', () => {
	test('it should correctly create, sign, and generate an ID for an m.room.name event', async () => {
		const signingKey = await generateKeyPairsFromString(
			'ed25519 a_HDhg WntaJ4JP5WbZZjDShjeuwqCybQ5huaZAiowji7tnIEw',
		);
		const serverName = 'rc1';
		const roomId = '!MZyyuzkUwHEaBBOXai:hs1';
		const userId = '@user1:rc1';
		const exampleTimestamp = 1678886400000;

		// 1. Create Event (m.room.create)
		const createEventPayload = roomCreateEvent({
			roomId,
			sender: userId,
			ts: exampleTimestamp - 2000, // No explicit content needed here
		});
		const signedCreateEvent = await signEvent(
			createEventPayload,
			signingKey,
			serverName,
		);
		const createEventId = generateId(signedCreateEvent);

		// 2. Mock Power Levels Event ID (as in m.room.message.spec.ts)
		const powerLevelsEventId = '$placeholder_power_levels_event_id';

		// 3. Member Event (sender's membership)
		const memberEventPayload = roomMemberEvent({
			roomId,
			sender: userId,
			state_key: userId,
			membership: 'join', // membership as a top-level property
			content: { displayname: 'Test User' }, // other content fields here
			ts: exampleTimestamp - 1000,
			depth: (signedCreateEvent.depth || 1) + 1,
			auth_events: { 'm.room.create': createEventId },
			prev_events: [createEventId],
		});
		const signedMemberEvent = await signEvent(
			memberEventPayload,
			signingKey,
			serverName,
		);
		const memberEventId = generateId(signedMemberEvent);

		// 4. Room Name Event
		const roomNamePayload = roomNameEvent({
			roomId,
			sender: userId,
			content: { name: 'New Room Name' },
			ts: exampleTimestamp,
			depth: (signedMemberEvent.depth || 2) + 1,
			auth_events: {
				'm.room.create': createEventId,
				'm.room.power_levels': powerLevelsEventId,
				'm.room.member': memberEventId,
			},
			prev_events: [memberEventId],
			origin: serverName,
		});

		const signedRoomNameEvent = await signEvent(
			roomNamePayload,
			signingKey,
			serverName,
		);
		const generatedEventId = generateId(signedRoomNameEvent);

		expect(finalEventId).toBe(generatedEventId);
		expect({
			...signedRoomNameEvent,
			event_id: generatedEventId,
		}).toStrictEqual(finalEventPlaceholder);
	});
});
