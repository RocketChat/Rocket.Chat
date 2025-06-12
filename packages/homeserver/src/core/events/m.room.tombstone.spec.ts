import { describe, expect, test } from 'bun:test';
import { generateId } from '../../authentication';
import { generateKeyPairsFromString } from '../../keys';
import { signEvent } from '../../signEvent';
import {
	createRoomTombstoneEvent,
	isRoomTombstoneEvent,
	roomTombstoneEvent,
} from './m.room.tombstone';
import type { EventBase } from './eventBase';

describe('m.room.tombstone', () => {
	const roomId = '!someroom:example.com';
	const sender = '@user:example.com';
	const body = 'This room has been replaced';
	const replacementRoom = '!newroom:example.com';
	const depth = 10;
	const auth_events = {
		'm.room.create': '$createEvent',
		'm.room.power_levels': '$powerLevelsEvent',
		'm.room.member': '$memberEvent',
	};
	const prev_events = ['$prevEvent'];

	test('should create a tombstone event', () => {
		const event = roomTombstoneEvent({
			roomId,
			sender,
			body,
			depth,
			auth_events,
			prev_events,
		});

		expect(event.type).toBe('m.room.tombstone');
		expect(event.room_id).toBe(roomId);
		expect(event.sender).toBe(sender);
		expect(event.content?.body).toBe(body);
		expect(event.content?.replacement_room).toBeUndefined();
		expect(event.state_key).toBe('');
	});

	test('should create a tombstone event with replacement room', () => {
		const event = roomTombstoneEvent({
			roomId,
			sender,
			body,
			replacementRoom,
			depth,
			auth_events,
			prev_events,
		});

		expect(event.type).toBe('m.room.tombstone');
		expect(event.room_id).toBe(roomId);
		expect(event.sender).toBe(sender);
		expect(event.content?.body).toBe(body);
		expect(event.content?.replacement_room).toBe(replacementRoom);
	});

	test('should identify a tombstone event correctly', () => {
		const event = roomTombstoneEvent({
			roomId,
			sender,
			body,
			depth,
			auth_events,
			prev_events,
		});

		expect(isRoomTombstoneEvent(event)).toBe(true);
		expect(isRoomTombstoneEvent({ ...event, type: 'm.room.message' })).toBe(
			false,
		);
	});

	test('should thoroughly validate different types of events with isRoomTombstoneEvent', () => {
		const validEvent = roomTombstoneEvent({
			roomId,
			sender,
			body,
			depth,
			auth_events,
			prev_events,
		});

		const messageEvent = { ...validEvent, type: 'm.room.message' };
		const createEvent = { ...validEvent, type: 'm.room.create' };
		const memberEvent = { ...validEvent, type: 'm.room.member' };

		const malformedEvent = { ...validEvent } as Record<string, unknown>;
		malformedEvent.type = null;

		const objectWithTypeOnly = { type: 'm.room.tombstone' };

		expect(isRoomTombstoneEvent(validEvent)).toBe(true);
		expect(isRoomTombstoneEvent(messageEvent)).toBe(false);
		expect(isRoomTombstoneEvent(createEvent)).toBe(false);
		expect(isRoomTombstoneEvent(memberEvent)).toBe(false);
		expect(isRoomTombstoneEvent(malformedEvent as unknown as EventBase)).toBe(
			false,
		);
		expect(
			isRoomTombstoneEvent(objectWithTypeOnly as unknown as EventBase),
		).toBe(true);
		expect(isRoomTombstoneEvent(null as unknown as EventBase)).toBe(false);
		expect(isRoomTombstoneEvent(undefined as unknown as EventBase)).toBe(false);
		expect(isRoomTombstoneEvent({} as unknown as EventBase)).toBe(false);
		expect(
			isRoomTombstoneEvent('m.room.tombstone' as unknown as EventBase),
		).toBe(false);
	});

	test('should validate event signature and ID', async () => {
		const signature = await generateKeyPairsFromString(
			'ed25519 a_HDhg WntaJ4JP5WbZZjDShjeuwqCybQ5huaZAiowji7tnIEw',
		);

		const expectedSignature =
			'leZQvRcjV9GwnSDtmuUtheOODSVpb98kszzyEw0X8ScqEYx0Z1eOIXhOFL3jcolFHGoFZMGYC5GGNN44x1BWBA';
		const expectedEventId = '$3Sw4iBWv9pil8BRt3ojPIWGLNQGpsKJoImxNoCmz7ME';

		const event = roomTombstoneEvent({
			roomId,
			sender,
			body,
			replacementRoom,
			depth,
			auth_events,
			prev_events,
			ts: 1733107418713,
			origin: 'hs1',
		});

		const signed = await signEvent(event, signature, 'hs1');

		expect(signed).toHaveProperty('signatures.hs1.ed25519:a_HDhg');
		expect(signed.signatures.hs1['ed25519:a_HDhg']).toBe(expectedSignature);

		const eventId = generateId(signed);
		expect(eventId).toBe(expectedEventId);
	});

	test('should create a room tombstone event with ID', async () => {
		const signature = await generateKeyPairsFromString(
			'ed25519 a_HDhg WntaJ4JP5WbZZjDShjeuwqCybQ5huaZAiowji7tnIEw',
		);

		const eventProps = {
			roomId,
			sender,
			body,
			replacementRoom,
			depth,
			auth_events,
			prev_events,
			ts: 1733107418713,
			origin: 'hs1',
		};

		const { createSignedEvent } = await import('./utils/createSignedEvent');
		const signEventFn = createSignedEvent(signature, 'hs1');
		const createEventFn = createRoomTombstoneEvent(signEventFn);

		const { event, _id: event_id } = await createEventFn(eventProps);

		expect(event.type).toBe('m.room.tombstone');
		expect(event.room_id).toBe(roomId);
		expect(event.sender).toBe(sender);
		expect(event.content.body).toBe(body);
		expect(event.content.replacement_room).toBe(replacementRoom);
		expect(event).toHaveProperty('signatures.hs1.ed25519:a_HDhg');
		expect(event_id).toBe('$3Sw4iBWv9pil8BRt3ojPIWGLNQGpsKJoImxNoCmz7ME');
	});
});
