import { expect, test } from 'bun:test';

import { generateId } from '../../authentication';
import { generateKeyPairsFromString } from '../../keys';
import { signEvent } from '../../signEvent';
import { roomCreateEvent } from './m.room.create';
import { roomMemberEvent } from './m.room.member';

const finalEventId = '$tZRt2bwceX4sG913Ee67tJiwe-gk859kY2mCeYSncw8';
const finalEvent = {
	auth_events: ['$0AQU5dG_mtjH6qavAxYrQsDC0a_-6T3DHs1yoxf5fz4'],
	prev_events: ['$0AQU5dG_mtjH6qavAxYrQsDC0a_-6T3DHs1yoxf5fz4'],
	type: 'm.room.member',
	room_id: '!uTqsSSWabZzthsSCNf:hs1',
	sender: '@admin:hs1',
	content: { displayname: 'admin', membership: 'join' },
	depth: 2,
	state_key: '@admin:hs1',
	origin: 'hs1',
	origin_server_ts: 1733107418672,
	hashes: { sha256: '7qLYbHf6z6nLGkN0DABO89wgDjaeZwq0ma7GsPbhZ8I' },
	signatures: {
		hs1: {
			'ed25519:a_HDhg':
				'y/qV5T9PeXvqgwRafZDSygtk4XRMstdt04qusZWJSu77Juxzzz4Ijyk+JsJ5NNV0/WWYMT9IhmVb7/EEBH4vDQ',
		},
	},
	unsigned: { age_ts: 1733107418672 },
};

test('roomMemberEvent', async () => {
	const signature = await generateKeyPairsFromString(
		'ed25519 a_HDhg WntaJ4JP5WbZZjDShjeuwqCybQ5huaZAiowji7tnIEw',
	);

	const createEvent = roomCreateEvent({
		roomId: '!uTqsSSWabZzthsSCNf:hs1',
		sender: '@admin:hs1',
		ts: 1733107418648,
	});
	const signedCreateEvent = await signEvent(createEvent, signature, 'hs1');

	const createEventId = generateId(signedCreateEvent);
	const memberEvent = roomMemberEvent({
		membership: 'join',
		roomId: '!uTqsSSWabZzthsSCNf:hs1',
		sender: '@admin:hs1',
		content: {
			displayname: 'admin',
		},
		state_key: '@admin:hs1',
		ts: 1733107418672,
		depth: 2,
		auth_events: {
			'm.room.create': createEventId,
		},
		prev_events: [createEventId],
	});
	const signed = await signEvent(memberEvent, signature, 'hs1');

	// @ts-ignore
	expect(signed).toStrictEqual(finalEvent);
	expect(signed).toHaveProperty(
		'signatures.hs1.ed25519:a_HDhg',
		'y/qV5T9PeXvqgwRafZDSygtk4XRMstdt04qusZWJSu77Juxzzz4Ijyk+JsJ5NNV0/WWYMT9IhmVb7/EEBH4vDQ',
	);

	const memberEventId = generateId(signed);

	expect(memberEventId).toBe(finalEventId);
});

test('roomMemberEvent - leave', async () => {
	const signature = await generateKeyPairsFromString(
		'ed25519 a_HDhg WntaJ4JP5WbZZjDShjeuwqCybQ5huaZAiowji7tnIEw',
	);
	const serverName = 'hs1';
	const roomId = '!leaveRoomTest:hs1';
	const userId = '@user_to_leave:hs1';
	const ts = Date.now();

	const createEventPayload = roomCreateEvent({
		roomId,
		sender: userId,
		ts: ts - 1000,
	});
	const signedCreateEvent = await signEvent(
		createEventPayload,
		signature,
		serverName,
	);
	const createEventId = generateId(signedCreateEvent);

	// A user usually joins before they can leave
	const joinMemberEventPayload = roomMemberEvent({
		membership: 'join',
		roomId,
		sender: userId,
		state_key: userId,
		content: { displayname: 'User To Leave' },
		depth: 2, // Assuming create is depth 1
		auth_events: { 'm.room.create': createEventId },
		prev_events: [createEventId],
		ts: ts - 500,
		origin: serverName,
	});
	const signedJoinEvent = await signEvent(
		joinMemberEventPayload,
		signature,
		serverName,
	);
	const joinEventId = generateId(signedJoinEvent);

	// Now, the leave event
	const leaveMemberEventPayload = roomMemberEvent({
		membership: 'leave',
		roomId,
		sender: userId,
		state_key: userId, // User leaving themselves
		depth: 3, // After create and join
		auth_events: {
			'm.room.create': createEventId,
			[`m.room.member:${userId}`]: joinEventId,
		},
		prev_events: [joinEventId],
		ts,
		origin: serverName,
		content: {
			membership: 'leave',
		},
	});

	const signedLeaveEvent = await signEvent(
		leaveMemberEventPayload,
		signature,
		serverName,
	);
	const leaveEventId = generateId(signedLeaveEvent);

	expect(signedLeaveEvent.type).toBe('m.room.member');
	expect(signedLeaveEvent.room_id).toBe(roomId);
	expect(signedLeaveEvent.sender).toBe(userId);
	expect(signedLeaveEvent.state_key).toBe(userId);
	expect(signedLeaveEvent.content.membership).toBe('leave');
	expect(signedLeaveEvent.origin).toBe(serverName);
	expect(signedLeaveEvent.origin_server_ts).toBe(ts);
	expect(signedLeaveEvent.prev_events).toEqual([joinEventId]);
	expect(signedLeaveEvent.auth_events).toContain(createEventId);
	expect(signedLeaveEvent.auth_events).toContain(joinEventId);
	expect(leaveEventId).toBeDefined();
	expect(
		signedLeaveEvent.signatures[serverName][
			`${signature.algorithm}:${signature.version}`
		],
	).toBeString();
	expect(Object.keys(signedLeaveEvent.content).length).toBe(1);
});

test('roomMemberEvent - kick', async () => {
	const kickerSignature = await generateKeyPairsFromString(
		'ed25519 kicker_key WntaJ4JP5WbZZjDShjeuwqCybQ5huaZAiowji7tnIEw',
	);
	const userToKickSignature = await generateKeyPairsFromString(
		'ed25519 kicked_key WntaJ4JP5WbZZjDShjeuwqCybQ5huaZAiowji7tnIEw',
	);
	const serverName = 'hs1';
	const roomId = '!kickRoomTest:hs1';
	const kickerId = '@kicker:hs1';
	const userToKickId = '@user_to_kick:hs1';
	const kickReason = 'Not a team player';
	let ts = Date.now();

	// 1. Create Event (sent by kicker)
	const createEventPayload = roomCreateEvent({
		roomId,
		sender: kickerId,
		ts: ts - 4000,
	});
	const signedCreateEvent = await signEvent(
		createEventPayload,
		kickerSignature,
		serverName,
	);
	const createEventId = generateId(signedCreateEvent);
	let lastEventId = createEventId;
	let currentDepth = 1;

	// 2. Power Levels Event (sent by kicker)
	// Kicker has power 100, can kick at 50. UserToKick has power 0.
	const powerLevelsEventPayload = {
		type: 'm.room.power_levels',
		room_id: roomId,
		sender: kickerId,
		state_key: '',
		content: {
			users: {
				[kickerId]: 100,
				[userToKickId]: 0,
			},
			users_default: 0,
			events: {
				'm.room.name': 50,
				'm.room.power_levels': 100,
			},
			events_default: 50,
			state_default: 50,
			kick: 50, // Kicker (100) can kick users if kick level is 50
			ban: 50,
			redact: 50,
		},
		depth: ++currentDepth,
		auth_events: [createEventId],
		prev_events: [lastEventId],
		origin: serverName,
		origin_server_ts: ts - 3000,
	};
	const signedPowerLevelsEvent = await signEvent(
		powerLevelsEventPayload,
		kickerSignature,
		serverName,
	);
	const powerLevelsEventId = generateId(signedPowerLevelsEvent);
	lastEventId = powerLevelsEventId;

	// 3. Kicker Joins (sent by kicker)
	const kickerJoinEventPayload = roomMemberEvent({
		membership: 'join',
		roomId,
		sender: kickerId,
		state_key: kickerId,
		content: { displayname: 'Kicker User' },
		depth: ++currentDepth,
		auth_events: {
			'm.room.create': createEventId,
			'm.room.power_levels': powerLevelsEventId,
		},
		prev_events: [lastEventId],
		ts: ts - 2000,
		origin: serverName,
	});
	const signedKickerJoinEvent = await signEvent(
		kickerJoinEventPayload,
		kickerSignature,
		serverName,
	);
	const kickerJoinEventId = generateId(signedKickerJoinEvent);
	lastEventId = kickerJoinEventId;

	// 4. UserToKick Joins (sent by userToKick)
	const userToKickJoinEventPayload = roomMemberEvent({
		membership: 'join',
		roomId,
		sender: userToKickId,
		state_key: userToKickId,
		content: { displayname: 'User To Be Kicked' },
		depth: ++currentDepth,
		auth_events: {
			'm.room.create': createEventId,
			'm.room.power_levels': powerLevelsEventId,
		},
		prev_events: [lastEventId],
		ts: ts - 1000,
		origin: serverName,
	});
	const signedUserToKickJoinEvent = await signEvent(
		userToKickJoinEventPayload,
		userToKickSignature,
		serverName,
	);
	const userToKickJoinEventId = generateId(signedUserToKickJoinEvent);
	lastEventId = userToKickJoinEventId;

	// 5. Kick Event (sent by kicker, targets userToKick)
	ts = Date.now();
	const kickMemberEventPayload = roomMemberEvent({
		membership: 'leave',
		roomId,
		sender: kickerId,
		state_key: userToKickId,
		depth: ++currentDepth,
		auth_events: {
			'm.room.create': createEventId,
			'm.room.power_levels': powerLevelsEventId,
			[`m.room.member:${userToKickId}`]: kickerJoinEventId,
		},
		prev_events: [lastEventId],
		ts,
		origin: serverName,
		content: {
			membership: 'leave',
			reason: kickReason,
		},
	});

	const signedKickEvent = await signEvent(
		kickMemberEventPayload,
		kickerSignature,
		serverName,
	);
	const kickEventId = generateId(signedKickEvent);

	// Assertions
	expect(signedKickEvent.type).toBe('m.room.member');
	expect(signedKickEvent.room_id).toBe(roomId);
	expect(signedKickEvent.sender).toBe(kickerId);
	expect(signedKickEvent.state_key).toBe(userToKickId);
	expect(signedKickEvent.content.membership).toBe('leave');
	expect(signedKickEvent.content.reason).toBe(kickReason);
	expect(signedKickEvent.origin).toBe(serverName);
	expect(signedKickEvent.origin_server_ts).toBe(ts);
	expect(signedKickEvent.prev_events).toEqual([userToKickJoinEventId]);

	// Verify that the PDU's auth_events contains the kicker's join event, power levels, and create event
	expect(signedKickEvent.auth_events).toContain(createEventId);
	expect(signedKickEvent.auth_events).toContain(powerLevelsEventId);
	expect(signedKickEvent.auth_events).toContain(kickerJoinEventId);

	expect(kickEventId).toBeDefined();
	expect(
		signedKickEvent.signatures[serverName][
			`${kickerSignature.algorithm}:${kickerSignature.version}`
		],
	).toBeString();
	expect(Object.keys(signedKickEvent.content).length).toBe(2); // membership + reason
});

test('roomMemberEvent - ban', async () => {
	const bannerSignature = await generateKeyPairsFromString(
		'ed25519 banner_key WntaJ4JP5WbZZjDShjeuwqCybQ5huaZAiowji7tnIEw',
	);
	const userToBanSignature = await generateKeyPairsFromString(
		'ed25519 banned_key WntaJ4JP5WbZZjDShjeuwqCybQ5huaZAiowji7tnIEw',
	);
	const serverName = 'hs1';
	const roomId = '!banRoomTest:hs1';
	const bannerId = '@banner:hs1';
	const userToBanId = '@user_to_ban:hs1';
	const banReason = 'Breaking the rules';
	let ts = Date.now();

	// 1. Create Event (sent by banner)
	const createEventPayload = roomCreateEvent({
		roomId,
		sender: bannerId,
		ts: ts - 4000,
	});
	const signedCreateEvent = await signEvent(
		createEventPayload,
		bannerSignature,
		serverName,
	);
	const createEventId = generateId(signedCreateEvent);
	let lastEventId = createEventId;
	let currentDepth = 1;

	// 2. Power Levels Event (sent by banner)
	// Banner has power 100, can ban at 50. UserToBan has power 0.
	const powerLevelsEventPayload = {
		type: 'm.room.power_levels',
		room_id: roomId,
		sender: bannerId,
		state_key: '',
		content: {
			users: {
				[bannerId]: 100,
				[userToBanId]: 0,
			},
			users_default: 0,
			events: {
				'm.room.name': 50,
				'm.room.power_levels': 100,
			},
			events_default: 50,
			state_default: 50,
			kick: 50,
			ban: 50, // Banner (100) can ban users if ban level is 50
			redact: 50,
		},
		depth: ++currentDepth,
		auth_events: [createEventId],
		prev_events: [lastEventId],
		origin: serverName,
		origin_server_ts: ts - 3000,
	};
	const signedPowerLevelsEvent = await signEvent(
		powerLevelsEventPayload,
		bannerSignature,
		serverName,
	);
	const powerLevelsEventId = generateId(signedPowerLevelsEvent);
	lastEventId = powerLevelsEventId;

	// 3. Banner Joins (sent by banner)
	const bannerJoinEventPayload = roomMemberEvent({
		membership: 'join',
		roomId,
		sender: bannerId,
		state_key: bannerId,
		content: { displayname: 'Banner User' },
		depth: ++currentDepth,
		auth_events: {
			'm.room.create': createEventId,
			'm.room.power_levels': powerLevelsEventId,
		},
		prev_events: [lastEventId],
		ts: ts - 2000,
		origin: serverName,
	});
	const signedBannerJoinEvent = await signEvent(
		bannerJoinEventPayload,
		bannerSignature,
		serverName,
	);
	const bannerJoinEventId = generateId(signedBannerJoinEvent);
	lastEventId = bannerJoinEventId;

	// 4. UserToBan Joins (sent by userToBan)
	const userToBanJoinEventPayload = roomMemberEvent({
		membership: 'join',
		roomId,
		sender: userToBanId,
		state_key: userToBanId,
		content: { displayname: 'User To Be Banned' },
		depth: ++currentDepth,
		auth_events: {
			'm.room.create': createEventId,
			'm.room.power_levels': powerLevelsEventId,
		},
		prev_events: [lastEventId],
		ts: ts - 1000,
		origin: serverName,
	});
	const signedUserToBanJoinEvent = await signEvent(
		userToBanJoinEventPayload,
		userToBanSignature,
		serverName,
	);
	const userToBanJoinEventId = generateId(signedUserToBanJoinEvent);
	lastEventId = userToBanJoinEventId;

	// 5. Ban Event (sent by banner, targets userToBan)
	ts = Date.now();
	const banMemberEventPayload = roomMemberEvent({
		membership: 'ban',
		roomId,
		sender: bannerId,
		state_key: userToBanId,
		depth: ++currentDepth,
		auth_events: {
			'm.room.create': createEventId,
			'm.room.power_levels': powerLevelsEventId,
			[`m.room.member:${userToBanId}`]: bannerJoinEventId,
		},
		prev_events: [lastEventId],
		ts,
		origin: serverName,
		content: {
			membership: 'ban',
			reason: banReason,
		},
	});

	const signedBanEvent = await signEvent(
		banMemberEventPayload,
		bannerSignature,
		serverName,
	);
	const banEventId = generateId(signedBanEvent);

	// Assertions
	expect(signedBanEvent.type).toBe('m.room.member');
	expect(signedBanEvent.room_id).toBe(roomId);
	expect(signedBanEvent.sender).toBe(bannerId);
	expect(signedBanEvent.state_key).toBe(userToBanId);
	expect(signedBanEvent.content.membership).toBe('ban');
	expect(signedBanEvent.content.reason).toBe(banReason);
	expect(signedBanEvent.origin).toBe(serverName);
	expect(signedBanEvent.origin_server_ts).toBe(ts);
	expect(signedBanEvent.prev_events).toEqual([userToBanJoinEventId]);

	// Verify that the PDU's auth_events contains the banner's join event, power levels, and create event
	expect(signedBanEvent.auth_events).toContain(createEventId);
	expect(signedBanEvent.auth_events).toContain(powerLevelsEventId);
	expect(signedBanEvent.auth_events).toContain(bannerJoinEventId);

	expect(banEventId).toBeDefined();
	expect(
		signedBanEvent.signatures[serverName][
			`${bannerSignature.algorithm}:${bannerSignature.version}`
		],
	).toBeString();
	expect(Object.keys(signedBanEvent.content).length).toBe(2); // membership + reason
});
