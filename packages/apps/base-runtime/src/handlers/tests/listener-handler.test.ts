import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import { MessageBuilder } from '../../lib/accessors/builders/MessageBuilder';
import { RoomBuilder } from '../../lib/accessors/builders/RoomBuilder';
import { MessageExtender } from '../../lib/accessors/extenders/MessageExtender';
import { RoomExtender } from '../../lib/accessors/extenders/RoomExtender';
import type { AppAccessors } from '../../lib/accessors/mod';
import { Room } from '../../lib/room';
import { parseArgs } from '../listener/handler';

describe('handlers > listeners', () => {
	const mockAppAccessors = {
		getReader: () => ({ __type: 'reader' }),
		getHttp: () => ({ __type: 'http' }),
		getModifier: () => ({ __type: 'modifier' }),
		getPersistence: () => ({ __type: 'persistence' }),
		getSenderFn: () => (id: string) => Promise.resolve([{ __type: 'bridgeCall' }, { id }]),
	} as unknown as AppAccessors;

	it('correctly parses the arguments for a request to trigger the "checkPreMessageSentPrevent" method', () => {
		const evtMethod = 'checkPreMessageSentPrevent';
		// For the 'checkPreMessageSentPrevent' method, the context will be a message in a real scenario
		const evtArgs = [{ __type: 'context' }];

		const params = parseArgs({ AppAccessorsInstance: mockAppAccessors }, evtMethod, evtArgs);

		assert.deepStrictEqual(params.length, 3);
		assert.deepStrictEqual(params[0], { __type: 'context' });
		assert.deepStrictEqual(params[1], { __type: 'reader' });
		assert.deepStrictEqual(params[2], { __type: 'http' });
	});

	it('correctly parses the arguments for a request to trigger the "checkPostMessageDeleted" method', () => {
		const evtMethod = 'checkPostMessageDeleted';
		// For the 'checkPostMessageDeleted' method, the context will be a message in a real scenario,
		// and the extraContext will provide further information such the user who deleted the message
		const evtArgs = [{ __type: 'context' }, { __type: 'extraContext' }];

		const params = parseArgs({ AppAccessorsInstance: mockAppAccessors }, evtMethod, evtArgs);

		assert.deepStrictEqual(params.length, 4);
		assert.deepStrictEqual(params[0], { __type: 'context' });
		assert.deepStrictEqual(params[1], { __type: 'reader' });
		assert.deepStrictEqual(params[2], { __type: 'http' });
		assert.deepStrictEqual(params[3], { __type: 'extraContext' });
	});

	it('correctly parses the arguments for a request to trigger the "checkPreRoomCreateExtend" method', () => {
		const evtMethod = 'checkPreRoomCreateExtend';
		// For the 'checkPreRoomCreateExtend' method, the context will be a room in a real scenario
		const evtArgs = [
			{
				id: 'fake',
				type: 'fake',
				slugifiedName: 'fake',
				creator: 'fake',
				createdAt: Date.now(),
			},
		];

		const params = parseArgs({ AppAccessorsInstance: mockAppAccessors }, evtMethod, evtArgs);

		assert.deepStrictEqual(params.length, 3);

		assert.ok(params[0] instanceof Room, `Expected instance of ${Room.name}`);
		assert.deepStrictEqual(params[1], { __type: 'reader' });
		assert.deepStrictEqual(params[2], { __type: 'http' });
	});

	it('correctly parses the arguments for a request to trigger the "executePreMessageSentExtend" method', () => {
		const evtMethod = 'executePreMessageSentExtend';
		// For the 'executePreMessageSentExtend' method, the context will be a message in a real scenario
		const evtArgs = [{ __type: 'context' }];

		const params = parseArgs({ AppAccessorsInstance: mockAppAccessors }, evtMethod, evtArgs);

		assert.deepStrictEqual(params.length, 5);
		// Instantiating the MessageExtender might modify the original object, so we need to assert it matches instead of equals
		assert.strictEqual((params[0] as any).__type, 'context');
		assert.ok(params[1] instanceof MessageExtender, `Expected instance of ${MessageExtender.name}`);
		assert.deepStrictEqual(params[2], { __type: 'reader' });
		assert.deepStrictEqual(params[3], { __type: 'http' });
		assert.deepStrictEqual(params[4], { __type: 'persistence' });
	});

	it('correctly parses the arguments for a request to trigger the "executePreRoomCreateExtend" method', () => {
		const evtMethod = 'executePreRoomCreateExtend';
		// For the 'executePreRoomCreateExtend' method, the context will be a room in a real scenario
		const evtArgs = [{ __type: 'context' }];

		const params = parseArgs({ AppAccessorsInstance: mockAppAccessors }, evtMethod, evtArgs);

		assert.deepStrictEqual(params.length, 5);
		// Instantiating the RoomExtender might modify the original object, so we need to assert it matches instead of equals
		assert.strictEqual((params[0] as any).__type, 'context');
		assert.ok(params[1] instanceof RoomExtender, `Expected instance of ${RoomExtender.name}`);
		assert.deepStrictEqual(params[2], { __type: 'reader' });
		assert.deepStrictEqual(params[3], { __type: 'http' });
		assert.deepStrictEqual(params[4], { __type: 'persistence' });
	});

	it('correctly parses the arguments for a request to trigger the "executePreMessageSentModify" method', () => {
		const evtMethod = 'executePreMessageSentModify';
		// For the 'executePreMessageSentModify' method, the context will be a message in a real scenario
		const evtArgs = [{ __type: 'context' }];

		const params = parseArgs({ AppAccessorsInstance: mockAppAccessors }, evtMethod, evtArgs);

		assert.deepStrictEqual(params.length, 5);
		// Instantiating the MessageBuilder might modify the original object, so we need to assert it matches instead of equals
		assert.strictEqual((params[0] as any).__type, 'context');
		assert.ok(params[1] instanceof MessageBuilder, `Expected instance of ${MessageBuilder.name}`);
		assert.deepStrictEqual(params[2], { __type: 'reader' });
		assert.deepStrictEqual(params[3], { __type: 'http' });
		assert.deepStrictEqual(params[4], { __type: 'persistence' });
	});

	it('correctly parses the arguments for a request to trigger the "executePreRoomCreateModify" method', () => {
		const evtMethod = 'executePreRoomCreateModify';
		// For the 'executePreRoomCreateModify' method, the context will be a room in a real scenario
		const evtArgs = [{ __type: 'context' }];

		const params = parseArgs({ AppAccessorsInstance: mockAppAccessors }, evtMethod, evtArgs);

		assert.deepStrictEqual(params.length, 5);
		// Instantiating the RoomBuilder might modify the original object, so we need to assert it matches instead of equals
		assert.strictEqual((params[0] as any).__type, 'context');
		assert.ok(params[1] instanceof RoomBuilder, `Expected instance of ${RoomBuilder.name}`);
		assert.deepStrictEqual(params[2], { __type: 'reader' });
		assert.deepStrictEqual(params[3], { __type: 'http' });
		assert.deepStrictEqual(params[4], { __type: 'persistence' });
	});

	it('correctly parses the arguments for a request to trigger the "executePostRoomUserJoined" method', () => {
		const evtMethod = 'executePostRoomUserJoined';
		// For the 'executePostRoomUserJoined' method, the context will be a room in a real scenario
		const room = {
			id: 'fake',
			type: 'fake',
			slugifiedName: 'fake',
			creator: 'fake',
			createdAt: Date.now(),
		};

		const evtArgs = [{ __type: 'context', room }];

		const params = parseArgs({ AppAccessorsInstance: mockAppAccessors }, evtMethod, evtArgs);

		assert.deepStrictEqual(params.length, 5);
		assert.ok((params[0] as any).room instanceof Room, `Expected instance of ${Room.name}`);
		assert.deepStrictEqual(params[1], { __type: 'reader' });
		assert.deepStrictEqual(params[2], { __type: 'http' });
		assert.deepStrictEqual(params[3], { __type: 'persistence' });
		assert.deepStrictEqual(params[4], { __type: 'modifier' });
	});

	it('correctly parses the arguments for a request to trigger the "executePostRoomUserLeave" method', () => {
		const evtMethod = 'executePostRoomUserLeave';
		// For the 'executePostRoomUserLeave' method, the context will be a room in a real scenario
		const room = {
			id: 'fake',
			type: 'fake',
			slugifiedName: 'fake',
			creator: 'fake',
			createdAt: Date.now(),
		};

		const evtArgs = [{ __type: 'context', room }];

		const params = parseArgs({ AppAccessorsInstance: mockAppAccessors }, evtMethod, evtArgs);

		assert.deepStrictEqual(params.length, 5);
		assert.ok((params[0] as any).room instanceof Room, `Expected instance of ${Room.name}`);
		assert.deepStrictEqual(params[1], { __type: 'reader' });
		assert.deepStrictEqual(params[2], { __type: 'http' });
		assert.deepStrictEqual(params[3], { __type: 'persistence' });
		assert.deepStrictEqual(params[4], { __type: 'modifier' });
	});

	it('correctly parses the arguments for a request to trigger the "executePostMessageDeleted" method', () => {
		const evtMethod = 'executePostMessageDeleted';
		// For the 'executePostMessageDeleted' method, the context will be a message in a real scenario
		const evtArgs = [{ __type: 'context' }, { __type: 'extraContext' }];

		const params = parseArgs({ AppAccessorsInstance: mockAppAccessors }, evtMethod, evtArgs);

		assert.deepStrictEqual(params.length, 6);
		assert.deepStrictEqual(params[0], { __type: 'context' });
		assert.deepStrictEqual(params[1], { __type: 'reader' });
		assert.deepStrictEqual(params[2], { __type: 'http' });
		assert.deepStrictEqual(params[3], { __type: 'persistence' });
		assert.deepStrictEqual(params[4], { __type: 'modifier' });
		assert.deepStrictEqual(params[5], { __type: 'extraContext' });
	});

	it('correctly parses the arguments for a request to trigger the "executePostMessageSent" method', () => {
		const evtMethod = 'executePostMessageSent';
		// For the 'executePostMessageDeleted' method, the context will be a message in a real scenario
		const evtArgs = [
			{
				id: 'fake',
				sender: 'fake',
				createdAt: Date.now(),
				room: {
					id: 'fake-room',
					type: 'fake',
					slugifiedName: 'fake',
					creator: 'fake',
					createdAt: Date.now(),
				},
			},
		];

		const params = parseArgs({ AppAccessorsInstance: mockAppAccessors }, evtMethod, evtArgs);

		assert.deepStrictEqual(params.length, 5);
		assert.strictEqual((params[0] as any).id, 'fake');
		assert.ok((params[0] as any).room instanceof Room, `Expected instance of ${Room.name}`);
		assert.deepStrictEqual(params[1], { __type: 'reader' });
		assert.deepStrictEqual(params[2], { __type: 'http' });
		assert.deepStrictEqual(params[3], { __type: 'persistence' });
		assert.deepStrictEqual(params[4], { __type: 'modifier' });
	});
});
