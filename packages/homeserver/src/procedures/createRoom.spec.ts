import { expect, test } from 'bun:test';
import { createRoom } from './createRoom';
import { createSignedEvent } from '../core/events/utils/createSignedEvent';
import { generateKeyPairsFromString } from '../keys';

test('createRoom event details and signatures', async () => {
	const signature = await generateKeyPairsFromString(
		'ed25519 a_XRhW YjbSyfqQeGto+OFswt+XwtJUUooHXH5w+czSgawN63U',
	);

	const makeSignedEvent = createSignedEvent(signature, 'hs1');

	const { roomId, events } = await createRoom(
		['@sender:hs1', '@username:hs1'],
		makeSignedEvent,
		'!roomId:hs1',
	);

	expect(roomId).toBe('!roomId:hs1');
	expect(events).toBeArrayOfSize(6);

	const [createEvt, memberEvt, powerEvt, joinEvt, histEvt, guestEvt] = events;

	// m.room.create
	expect(createEvt.event.type).toBe('m.room.create');
	expect(createEvt.event.room_id).toBe(roomId);
	expect(createEvt.event.content.room_version).toBe('10');
	expect(createEvt.event.content.creator).toBe('@sender:hs1');
	expect(createEvt._id).toMatch(/^\$/);
	expect(createEvt.event.signatures).toHaveProperty('hs1');
	const sigEntries = Object.keys(createEvt.event.signatures.hs1);
	expect(sigEntries).toContain('ed25519:a_XRhW');

	// m.room.member
	expect(memberEvt.event.type).toBe('m.room.member');
	expect(memberEvt.event.content.membership).toBe('join');
	expect(memberEvt.event.state_key).toBe('@sender:hs1');
	expect(memberEvt._id).toMatch(/^\$/);

	// m.room.power_levels
	expect(powerEvt.event.type).toBe('m.room.power_levels');
	const users = powerEvt.event.content.users;
	expect(typeof users).toBe('object');
	expect(users['@sender:hs1']).toBe(100);
	expect(users['@username:hs1']).toBe(100);
	expect(Object.keys(users).sort()).toEqual(
		['@sender:hs1', '@username:hs1'].sort(),
	);
	expect(powerEvt._id).toMatch(/^\$/);

	// m.room.join_rules
	expect(joinEvt.event.type).toBe('m.room.join_rules');
	expect(joinEvt.event.content.join_rule).toBe('invite');

	// m.room.history_visibility
	expect(histEvt.event.type).toBe('m.room.history_visibility');
	expect(histEvt.event.content.history_visibility).toBe('shared');

	// m.room.guest_access
	expect(guestEvt.event.type).toBe('m.room.guest_access');
	expect(guestEvt.event.content.guest_access).toBe('can_join');
});

test('createRoom event ids are unique', async () => {
	const signature = await generateKeyPairsFromString(
		'ed25519 a_XRhW YjbSyfqQeGto+OFswt+XwtJUUooHXH5w+czSgawN63U',
	);
	const makeSignedEvent = createSignedEvent(signature, 'hs1');
	const { events } = await createRoom(
		['@sender:hs1', '@username:hs1'],
		makeSignedEvent,
		'!roomId:hs1',
	);
	const ids = events.map((e) => e._id);
	expect(new Set(ids).size).toBe(events.length);
});

test('createRoom auth_events and prev_events chain correctly', async () => {
	const signature = await generateKeyPairsFromString(
		'ed25519 a_XRhW YjbSyfqQeGto+OFswt+XwtJUUooHXH5w+czSgawN63U',
	);
	const makeSignedEvent = createSignedEvent(signature, 'hs1');
	const { events } = await createRoom(
		['@sender:hs1', '@username:hs1'],
		makeSignedEvent,
		'!roomId:hs1',
	);
	const [
		createEvent,
		memberEvent,
		powerLevelsEvent,
		joinRulesEvent,
		historyVisibilityEvent,
		guestAccessEvent,
	] = events;
	expect(memberEvent.event.prev_events).toEqual([createEvent._id]);
	expect(powerLevelsEvent.event.auth_events).toEqual([
		createEvent._id,
		memberEvent._id,
	]);
	expect(powerLevelsEvent.event.prev_events).toEqual([memberEvent._id]);
	expect(joinRulesEvent.event.auth_events).toEqual([
		createEvent._id,
		memberEvent._id,
		powerLevelsEvent._id,
	]);
	expect(joinRulesEvent.event.prev_events).toEqual([powerLevelsEvent._id]);
	expect(historyVisibilityEvent.event.auth_events).toEqual([
		createEvent._id,
		memberEvent._id,
		powerLevelsEvent._id,
	]);
	expect(historyVisibilityEvent.event.prev_events).toEqual([
		joinRulesEvent._id,
	]);
	expect(guestAccessEvent.event.auth_events).toEqual([
		createEvent._id,
		memberEvent._id,
		powerLevelsEvent._id,
	]);
	expect(guestAccessEvent.event.prev_events).toEqual([
		historyVisibilityEvent._id,
	]);
});
