// deno-lint-ignore-file no-explicit-any
import { afterAll, beforeEach, describe, it } from 'https://deno.land/std@0.203.0/testing/bdd.ts';
import { assertSpyCall, spy, stub } from 'https://deno.land/std@0.203.0/testing/mock.ts';
import { assertEquals, assertRejects } from 'https://deno.land/std@0.203.0/assert/mod.ts';

import { AppObjectRegistry } from '../../../AppObjectRegistry.ts';
import { ModifyUpdater } from '../modify/ModifyUpdater.ts';
import { RoomBuilder } from '../builders/RoomBuilder.ts';
import jsonrpc from 'jsonrpc-lite';

describe('ModifyUpdater', () => {
	let modifyUpdater: ModifyUpdater;

	const senderFn = (r: any) =>
		Promise.resolve({
			id: Math.random().toString(36).substring(2),
			jsonrpc: '2.0',
			result: structuredClone(r),
			serialize() {
				return JSON.stringify(this);
			},
		});

	beforeEach(() => {
		AppObjectRegistry.clear();
		AppObjectRegistry.set('id', 'deno-test');
		modifyUpdater = new ModifyUpdater(senderFn);
	});

	afterAll(() => {
		AppObjectRegistry.clear();
	});

	it('correctly formats requests for the update message flow', async () => {
		const _spy = spy(modifyUpdater, 'senderFn' as keyof ModifyUpdater);

		const messageBuilder = await modifyUpdater.message('123', { id: '456' } as any);

		assertSpyCall(_spy, 0, {
			args: [
				{
					method: 'bridges:getMessageBridge:doGetById',
					params: ['123', 'deno-test'],
				},
			],
		});

		messageBuilder.setUpdateData(
			{
				id: '123',
				room: { id: '123' },
				sender: { id: '456' },
				text: 'Hello World',
			},
			{
				id: '456',
			},
		);

		await modifyUpdater.finish(messageBuilder);

		assertSpyCall(_spy, 1, {
			args: [
				{
					method: 'bridges:getMessageBridge:doUpdate',
					params: [{ id: '123', ...messageBuilder.getChanges() }, 'deno-test'],
				},
			],
		});

		_spy.restore();
	});

	it('correctly formats requests for the update room flow', async () => {
		const _spy = spy(modifyUpdater, 'senderFn' as keyof ModifyUpdater);

		const roomBuilder = (await modifyUpdater.room('123', { id: '456' } as any)) as RoomBuilder;

		assertSpyCall(_spy, 0, {
			args: [
				{
					method: 'bridges:getRoomBridge:doGetById',
					params: ['123', 'deno-test'],
				},
			],
		});

		roomBuilder.setData({
			id: '123',
			type: 'c',
			displayName: 'Test Room',
			slugifiedName: 'test-room',
			creator: { id: '456' },
		});

		roomBuilder.setMembersToBeAddedByUsernames(['username1', 'username2']);

		// We need to sneak in the id as the `modifyUpdater.room` call won't have legitimate data
		roomBuilder.getRoom().id = '123';

		await modifyUpdater.finish(roomBuilder);

		assertSpyCall(_spy, 1, {
			args: [
				{
					method: 'bridges:getRoomBridge:doUpdate',
					params: [{ id: '123', ...roomBuilder.getChanges() }, roomBuilder.getMembersToBeAddedUsernames(), 'deno-test'],
				},
			],
		});
	});

	it('correctly formats requests to UserUpdater methods', async () => {
		const result = (await modifyUpdater.getUserUpdater().updateStatusText({ id: '123' } as any, 'Hello World')) as any;

		assertEquals(result, {
			method: 'accessor:getModifier:getUpdater:getUserUpdater:updateStatusText',
			params: [{ id: '123' }, 'Hello World'],
		});
	});

	it('correctly formats requests to LivechatUpdater methods', async () => {
		const result = (await modifyUpdater.getLivechatUpdater().closeRoom({ id: '123' } as any, 'close it!')) as any;

		assertEquals(result, {
			method: 'accessor:getModifier:getUpdater:getLivechatUpdater:closeRoom',
			params: [{ id: '123' }, 'close it!'],
		});
	});

	describe('Error Handling', () => {
		describe('message', () => {
			it('throws an instance of Error when senderFn throws an error', async () => {
				const _stub = stub(modifyUpdater, 'senderFn' as keyof ModifyUpdater, () => Promise.reject(new Error('unit-test-error')) as any);

				await assertRejects(() => modifyUpdater.message('message-id', { _id: 'user-id' } as any), Error, 'unit-test-error');

				_stub.restore();
			});

			it('throws an instance of Error when senderFn throws a jsonrpc error', async () => {
				const _stub = stub(
					modifyUpdater,
					'senderFn' as keyof ModifyUpdater,
					() => Promise.reject(jsonrpc.error('unit-test-error', new jsonrpc.JsonRpcError('unit-test-error', 1000))) as any,
				);

				await assertRejects(() => modifyUpdater.message('message-id', { _id: 'user-id' } as any), Error, 'unit-test-error');

				_stub.restore();
			});

			it('throws an instance of Error when senderFn throws an unknown value', async () => {
				const _stub = stub(modifyUpdater, 'senderFn' as keyof ModifyUpdater, () => Promise.reject({}) as any);

				await assertRejects(() => modifyUpdater.message('message-id', { _id: 'user-id' } as any), Error, 'An unknown error occurred');

				_stub.restore();
			});
		});

		describe('room', () => {
			it('throws an instance of Error when senderFn throws an error', async () => {
				const _stub = stub(modifyUpdater, 'senderFn' as keyof ModifyUpdater, () => Promise.reject(new Error('unit-test-error')) as any);

				await assertRejects(() => modifyUpdater.room('room-id', { _id: 'user-id' } as any), Error, 'unit-test-error');

				_stub.restore();
			});

			it('throws an instance of Error when senderFn throws a jsonrpc error', async () => {
				const _stub = stub(
					modifyUpdater,
					'senderFn' as keyof ModifyUpdater,
					() => Promise.reject(jsonrpc.error('unit-test-error', new jsonrpc.JsonRpcError('unit-test-error', 1000))) as any,
				);

				await assertRejects(() => modifyUpdater.room('room-id', { _id: 'user-id' } as any), Error, 'unit-test-error');

				_stub.restore();
			});

			it('throws an instance of Error when senderFn throws an unknown value', async () => {
				const _stub = stub(modifyUpdater, 'senderFn' as keyof ModifyUpdater, () => Promise.reject({}) as any);

				await assertRejects(() => modifyUpdater.room('room-id', { _id: 'user-id' } as any), Error, 'An unknown error occurred');

				_stub.restore();
			});
		});

		describe('finish', () => {
			const messageUpdater = {
				kind: 'message',
				getMessage: () => ({
					id: 'message-id',
					sender: { id: 'sender-id' },
				}),
				getChanges: () => ({
					id: 'message-id',
					sender: { id: 'sender-id' },
				}),
			} as any;

			it('throws an instance of Error when senderFn throws an error', async () => {
				const _stub = stub(modifyUpdater, 'senderFn' as keyof ModifyUpdater, () => Promise.reject(new Error('unit-test-error')) as any);

				await assertRejects(() => modifyUpdater.finish(messageUpdater), Error, 'unit-test-error');

				_stub.restore();
			});

			it('throws an instance of Error when senderFn throws a jsonrpc error', async () => {
				const _stub = stub(
					modifyUpdater,
					'senderFn' as keyof ModifyUpdater,
					() => Promise.reject(jsonrpc.error('unit-test-error', new jsonrpc.JsonRpcError('unit-test-error', 1000))) as any,
				);

				await assertRejects(() => modifyUpdater.finish(messageUpdater), Error, 'unit-test-error');

				_stub.restore();
			});

			it('throws an instance of Error when senderFn throws an unknown value', async () => {
				const _stub = stub(modifyUpdater, 'senderFn' as keyof ModifyUpdater, () => Promise.reject({}) as any);

				await assertRejects(() => modifyUpdater.finish(messageUpdater), Error, 'An unknown error occurred');

				_stub.restore();
			});
		});
	});
});
