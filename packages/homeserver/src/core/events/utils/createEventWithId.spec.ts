import { expect, test, describe } from 'bun:test';
import { generateId } from '../../../authentication';
import { generateKeyPairsFromString } from '../../../keys';
import { createSignedEvent, createEventWithId } from './createSignedEvent';

describe('createEventWithId', () => {
	test('it should add an ID to a signed event', async () => {
		const signature = await generateKeyPairsFromString(
			'ed25519 a_XRhW YjbSyfqQeGto+OFswt+XwtJUUooHXH5w+czSgawN63U',
		);

		const testEvent = () => ({
			type: 'm.test.event',
			room_id: '!roomid:test.server',
			sender: '@user:test.server',
			origin_server_ts: 1733069433734,
			content: { test: 'data' },
		});

		const makeSignedEvent = createSignedEvent(signature, 'test.server');
		const withId = createEventWithId(testEvent)(makeSignedEvent);
		const result = await withId();

		expect(result).toHaveProperty('event');
		expect(result).toHaveProperty('_id');
		expect(result.event.type).toBe('m.test.event');
		expect(result.event.content.test).toBe('data');
		expect(result._id).toBe(generateId(result.event));
	});

	test('it should generate unique IDs for different events', async () => {
		const signature = await generateKeyPairsFromString(
			'ed25519 a_XRhW YjbSyfqQeGto+OFswt+XwtJUUooHXH5w+czSgawN63U',
		);

		const testEvent1 = () => ({
			type: 'm.test.event',
			room_id: '!room1:test.server',
			sender: '@user:test.server',
			origin_server_ts: 1733069433734,
			content: { id: 'event1' },
		});

		const testEvent2 = () => ({
			type: 'm.test.event',
			room_id: '!room2:test.server',
			sender: '@different:test.server',
			origin_server_ts: 1733069433735,
			content: { id: 'event2' },
		});

		const makeSignedEvent = createSignedEvent(signature, 'test.server');
		const withId1 = createEventWithId(testEvent1)(makeSignedEvent);
		const withId2 = createEventWithId(testEvent2)(makeSignedEvent);
		const result1 = await withId1();
		const result2 = await withId2();

		expect(result1._id).not.toBe(result2._id);
		expect(result1._id).toBe(generateId(result1.event));
		expect(result2._id).toBe(generateId(result2.event));
		expect(result1.event.content.id).toBe('event1');
		expect(result2.event.content.id).toBe('event2');
	});

	test('it should work with async event generators', async () => {
		const signature = await generateKeyPairsFromString(
			'ed25519 a_XRhW YjbSyfqQeGto+OFswt+XwtJUUooHXH5w+czSgawN63U',
		);

		const asyncTestEvent = async () => {
			await new Promise((resolve) => setTimeout(resolve, 10));
			return {
				type: 'm.test.async.event',
				room_id: '!asyncroom:test.server',
				sender: '@user:test.server',
				origin_server_ts: 1733069433734,
				content: { async: true },
			};
		};

		const makeSignedEvent = createSignedEvent(signature, 'test.server');
		const withId = createEventWithId(asyncTestEvent)(makeSignedEvent);
		const result = (await withId()) as unknown as {
			_id: string;
			event: {
				type: string;
				room_id: string;
				sender: string;
				origin_server_ts: number;
				content: {
					async: boolean;
				};
			};
		};

		expect(result).toHaveProperty('event');
		expect(result).toHaveProperty('_id');
		expect(result.event.type).toBe('m.test.async.event');
		expect(result.event.content.async).toBe(true);
		expect(result._id).toBe(generateId(result.event));
	});
});
