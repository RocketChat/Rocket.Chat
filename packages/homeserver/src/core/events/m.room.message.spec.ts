import { expect, test } from 'bun:test';

import { generateId } from '../../authentication';
import { generateKeyPairsFromString } from '../../keys';
import { signEvent } from '../../signEvent';
import { roomCreateEvent } from './m.room.create';
import { roomMemberEvent } from './m.room.member';
import { roomMessageEvent } from './m.room.message';

const finalEventId = '$afPoLMnslJ04cnrzTzUX_Yjxmp5eS2yFyY9u7a_Xiv8';
const finalEvent = {
	auth_events: [
		'$zHsjo62uA3WT_8ZGvr53LIUxPOTbJ-MKPu2JsA6eGdw',
		'$mockedPowerLevelsEventId',
		'$iyTj_L9HN1LNr2wjiHLz6Q7-HVjrKnCWyvwEM2yl6gE',
	],
	prev_events: ['$iyTj_L9HN1LNr2wjiHLz6Q7-HVjrKnCWyvwEM2yl6gE'],
	type: 'm.room.message',
	room_id: '!MZyyuzkUwHEaBBOXai:hs1',
	sender: '@user:rc1',
	depth: 3,
	origin: 'rc1',
	origin_server_ts: 1747792498236,
	content: {
		msgtype: 'm.text',
		body: 'Hello, world!',
		'm.mentions': {},
	},
	state_key: undefined,
	hashes: {
		sha256: 'X6blXh+6vUEh1VgDaxh0o/F09AWNi6i2GOdzafUSnOA',
	},
	unsigned: {
		age_ts: 1747792498236,
	},
	signatures: {
		rc1: {
			'ed25519:a_HDhg':
				'i3Fl5Iq3KimM/AsZuhfiN1iBln1cY7EUmOhVyfRfrrEZkzhuOilwOVsWiWS8bmwqtgIOa7A8EFuTr6BoHklLBQ',
		},
	},
};

test('roomMessageEvent', async () => {
	const signature = await generateKeyPairsFromString(
		'ed25519 a_HDhg WntaJ4JP5WbZZjDShjeuwqCybQ5huaZAiowji7tnIEw',
	);

	// Create a room
	const createEvent = roomCreateEvent({
		roomId: '!MZyyuzkUwHEaBBOXai:hs1',
		sender: '@user:rc1',
		ts: 1747792498236,
	});
	const signedCreateEvent = await signEvent(createEvent, signature, 'rc1');

	const createEventId = generateId(signedCreateEvent);

	// Create a member event for the sender
	const memberEvent = roomMemberEvent({
		membership: 'join',
		roomId: '!MZyyuzkUwHEaBBOXai:hs1',
		sender: '@user:rc1',
		content: {
			displayname: 'user',
		},
		state_key: '@user:rc1',
		ts: 1747792498236,
		depth: 3,
		auth_events: {
			'm.room.create': createEventId,
		},
		prev_events: [createEventId],
	});
	const signedMemberEvent = await signEvent(memberEvent, signature, 'rc1');
	const memberEventId = generateId(signedMemberEvent);

	// Create a power levels event (mocked for testing)
	const powerLevelsEventId = '$mockedPowerLevelsEventId';

	// Create a message event
	const messageEvent = roomMessageEvent({
		roomId: '!MZyyuzkUwHEaBBOXai:hs1',
		sender: '@user:rc1',
		content: {
			body: 'Hello, world!',
			msgtype: 'm.text',
			'm.mentions': {},
		},
		ts: 1747792498236,
		depth: 3,
		auth_events: {
			'm.room.create': createEventId,
			'm.room.power_levels': powerLevelsEventId,
			'm.room.member': memberEventId,
		},
		prev_events: [memberEventId],
	});
	const signed = await signEvent(messageEvent, signature, 'rc1');

	// @ts-ignore
	expect(signed).toStrictEqual(finalEvent);
	expect(signed).toHaveProperty(
		'signatures.rc1.ed25519:a_HDhg',
		'i3Fl5Iq3KimM/AsZuhfiN1iBln1cY7EUmOhVyfRfrrEZkzhuOilwOVsWiWS8bmwqtgIOa7A8EFuTr6BoHklLBQ',
	);

	const messageEventId = generateId(signed);
	expect(messageEventId).toBe(finalEventId);
});
