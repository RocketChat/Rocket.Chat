import { expect, test } from 'bun:test';

import { generateId } from '../../authentication';
import { generateKeyPairsFromString } from '../../keys';
import { signEvent, type SignedEvent } from '../../signEvent';
import {
	roomPowerLevelsEvent,
	type RoomPowerLevelsEvent,
} from './m.room.power_levels';

const finalEventId = '$T20EETjD2OuaC1OVyg8iIbJGTNeGBsMiWoAagBOVRNE';
const finalEvent = {
	auth_events: [
		'$0AQU5dG_mtjH6qavAxYrQsDC0a_-6T3DHs1yoxf5fz4',
		'$tZRt2bwceX4sG913Ee67tJiwe-gk859kY2mCeYSncw8',
	],
	prev_events: ['$tZRt2bwceX4sG913Ee67tJiwe-gk859kY2mCeYSncw8'],
	type: 'm.room.power_levels',
	room_id: '!uTqsSSWabZzthsSCNf:hs1',
	sender: '@admin:hs1',
	content: {
		users: { '@admin:hs1': 100, '@asd6:rc1': 100 },
		users_default: 0,
		events: {
			'm.room.name': 50,
			'm.room.power_levels': 100,
			'm.room.history_visibility': 100,
			'm.room.canonical_alias': 50,
			'm.room.avatar': 50,
			'm.room.tombstone': 100,
			'm.room.server_acl': 100,
			'm.room.encryption': 100,
		},
		events_default: 0,
		state_default: 50,
		ban: 50,
		kick: 50,
		redact: 50,
		invite: 0,
		historical: 100,
	},
	depth: 3,
	state_key: '',
	origin: 'hs1',
	origin_server_ts: 1733107418713,
	hashes: { sha256: '7Sv2UTnpNI9qnVO1oXaNoj1SEraxoWTm9uloqm3Oqho' },
	signatures: {
		hs1: {
			'ed25519:a_HDhg':
				'UBNpsQBCDX7t6cPHSj+g4bfAf/9Gb1TxYnme2MCXF4JgN7P3X0OUq0leFjrI5p/+sTR60/nuaZCX7OUYWTTLDA',
		},
	},
	unsigned: { age_ts: 1733107418713 },
};

const finalCustomEventId = '$WGaFkwMwZjjIx-cLZ-vgRIPdc_5w2VtTvJT2N_9iufY';
const finalCustomEvent: Omit<SignedEvent<RoomPowerLevelsEvent>, 'event_id'> = {
	auth_events: ['$auth1:hs1', '$auth2:hs1'],
	prev_events: ['$prev1:hs1'],
	type: 'm.room.power_levels',
	room_id: '!customRoom:hs1',
	sender: '@customSender:hs1',
	content: {
		users: { '@customSender:hs1': 100, '@targetUser:hs1': 75 },
		users_default: 10,
		events: {
			'm.room.name': 60,
			'm.room.power_levels': 100,
			'm.room.history_visibility': 100,
			'm.room.canonical_alias': 50,
			'm.room.avatar': 50,
			'm.room.tombstone': 100,
			'm.room.server_acl': 100,
			'm.room.encryption': 100,
		},
		events_default: 5,
		state_default: 55,
		ban: 70,
		kick: 60,
		redact: 50,
		invite: 50,
		historical: 100,
		notifications: {
			room: 75,
		},
	},
	depth: 5,
	state_key: '',
	origin: 'hs1',
	origin_server_ts: 1748224026175,
	hashes: { sha256: 'y0ffUmoWZ9WYPiGk8fdrDyu0Sc7JRpTBsmnjRUoPL7I' },
	signatures: {
		hs1: {
			'ed25519:test_key_custom':
				'x8W5woA58MTdNlxF5PY+m3MvrJVOmBOVuB/xG3+kQ/pX6EEdmAexVUYGCtzf7GcIk9TsGGG6Q1NmJOxyH6PrBQ',
		},
	},
	unsigned: { age_ts: 1748224026175 },
};

test('roomPowerLevelsEvent', async () => {
	const signature = await generateKeyPairsFromString(
		'ed25519 a_HDhg WntaJ4JP5WbZZjDShjeuwqCybQ5huaZAiowji7tnIEw',
	);

	const event = roomPowerLevelsEvent({
		roomId: '!uTqsSSWabZzthsSCNf:hs1',
		auth_events: [
			'$0AQU5dG_mtjH6qavAxYrQsDC0a_-6T3DHs1yoxf5fz4',
			'$tZRt2bwceX4sG913Ee67tJiwe-gk859kY2mCeYSncw8',
		],
		depth: 3,
		prev_events: ['$tZRt2bwceX4sG913Ee67tJiwe-gk859kY2mCeYSncw8'],
		members: ['@admin:hs1', '@asd6:rc1'],
		ts: 1733107418713,
	});

	const signed = await signEvent(event, signature, 'hs1');

	expect(signed).toStrictEqual(finalEvent as any);
	expect(signed).toHaveProperty(
		'signatures.hs1.ed25519:a_HDhg',
		'UBNpsQBCDX7t6cPHSj+g4bfAf/9Gb1TxYnme2MCXF4JgN7P3X0OUq0leFjrI5p/+sTR60/nuaZCX7OUYWTTLDA',
	);

	const eventId = generateId(signed);

	expect(eventId).toBe(finalEventId);
});

test('roomPowerLevelsEvent with custom content', async () => {
	const signature = await generateKeyPairsFromString(
		'ed25519 test_key_custom WntaJ4JP5WbZZjDShjeuwqCybQ5huaZAiowji7tnIEw',
	);

	const roomId = '!customRoom:hs1';
	const senderId = '@customSender:hs1';
	const targetUserId = '@targetUser:hs1';

	const customContent: RoomPowerLevelsEvent['content'] = {
		users: {
			[senderId]: 100,
			[targetUserId]: 75,
		},
		users_default: 10,
		events: {
			'm.room.name': 60,
			'm.room.power_levels': 100,
			'm.room.history_visibility': 100,
			'm.room.canonical_alias': 50,
			'm.room.avatar': 50,
			'm.room.tombstone': 100,
			'm.room.server_acl': 100,
			'm.room.encryption': 100,
		},
		events_default: 5,
		state_default: 55,
		ban: 70,
		kick: 60,
		redact: 50,
		invite: 50,
		historical: 100,
		notifications: {
			room: 75,
		},
	};

	const event = roomPowerLevelsEvent({
		roomId,
		members: [senderId, targetUserId],
		auth_events: ['$auth1:hs1', '$auth2:hs1'],
		prev_events: ['$prev1:hs1'],
		depth: 5,
		content: customContent,
		ts: 1748224026175,
	});

	const signed: Omit<
		SignedEvent<RoomPowerLevelsEvent>,
		'event_id'
	> = await signEvent(event, signature, 'hs1');
	const eventId = generateId(signed);

	expect(signed).toStrictEqual(finalCustomEvent);
	expect(eventId).toBe(finalCustomEventId);
});
