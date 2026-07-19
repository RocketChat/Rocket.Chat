import * as assert from 'node:assert';
import { after, beforeEach, describe, it, mock } from 'node:test';

import jsonrpc from 'jsonrpc-lite';

import { AppObjectRegistry } from '../../../AppObjectRegistry';
import { ModifyExtender } from '../modify/ModifyExtender';

describe('ModifyExtender', () => {
	let extender: ModifyExtender;

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
		extender = new ModifyExtender(senderFn);
	});

	after(() => {
		AppObjectRegistry.clear();
	});

	it('correctly formats requests for the extend message requests', async () => {
		const _spy = mock.method(extender, 'senderFn' as any);

		const messageExtender = await extender.extendMessage('message-id', { _id: 'user-id' } as any);

		assert.deepStrictEqual(_spy.mock.calls[0].arguments, [
			{
				method: 'bridges:getMessageBridge:doGetById',
				params: ['message-id', 'deno-test'],
			},
		]);

		messageExtender.addCustomField('key', 'value');

		await extender.finish(messageExtender);

		assert.deepStrictEqual(_spy.mock.calls[1].arguments, [
			{
				method: 'bridges:getMessageBridge:doUpdate',
				params: [messageExtender.getMessage(), 'deno-test'],
			},
		]);

		_spy.mock.restore();
	});

	it('correctly formats requests for the extend room requests', async () => {
		const _spy = mock.method(extender, 'senderFn' as any);

		const roomExtender = await extender.extendRoom('room-id', { _id: 'user-id' } as any);

		assert.deepStrictEqual(_spy.mock.calls[0].arguments, [
			{
				method: 'bridges:getRoomBridge:doGetById',
				params: ['room-id', 'deno-test'],
			},
		]);

		roomExtender.addCustomField('key', 'value');

		await extender.finish(roomExtender);

		assert.deepStrictEqual(_spy.mock.calls[1].arguments, [
			{
				method: 'bridges:getRoomBridge:doUpdate',
				params: [roomExtender.getRoom(), [], 'deno-test'],
			},
		]);

		_spy.mock.restore();
	});

	it('correctly formats requests for the extend video conference requests', async () => {
		const _spy = mock.method(extender, 'senderFn' as any);

		const videoConferenceExtender = await extender.extendVideoConference('video-conference-id');

		assert.deepStrictEqual(_spy.mock.calls[0].arguments, [
			{
				method: 'bridges:getVideoConferenceBridge:doGetById',
				params: ['video-conference-id', 'deno-test'],
			},
		]);

		videoConferenceExtender.setStatus(4);

		await extender.finish(videoConferenceExtender);

		assert.deepStrictEqual(_spy.mock.calls[1].arguments, [
			{
				method: 'bridges:getVideoConferenceBridge:doUpdate',
				params: [videoConferenceExtender.getVideoConference(), 'deno-test'],
			},
		]);

		_spy.mock.restore();
	});

	describe('Error Handling', () => {
		describe('extendMessage', () => {
			it('throws an instance of Error when senderFn throws an error', async () => {
				const _stub = mock.method(extender, 'senderFn' as any, () => Promise.reject(new Error('unit-test-error')) as any);

				await assert.rejects(() => extender.extendMessage('message-id', { _id: 'user-id' } as any), { message: 'unit-test-error' });

				_stub.mock.restore();
			});

			it('throws an instance of Error when senderFn throws a jsonrpc error', async () => {
				const _stub = mock.method(
					extender,
					'senderFn' as any,
					() => Promise.reject(jsonrpc.error('unit-test-error', new jsonrpc.JsonRpcError('unit-test-error', 1000))) as any,
				);

				await assert.rejects(() => extender.extendMessage('message-id', { _id: 'user-id' } as any), { message: 'unit-test-error' });

				_stub.mock.restore();
			});

			it('throws an instance of Error when senderFn throws an unknown value', async () => {
				const _stub = mock.method(extender, 'senderFn' as any, () => Promise.reject({}) as any);

				await assert.rejects(() => extender.extendMessage('message-id', { _id: 'user-id' } as any), {
					message: 'An unknown error occurred',
				});

				_stub.mock.restore();
			});
		});

		describe('extendRoom', () => {
			it('throws an instance of Error when senderFn throws an error', async () => {
				const _stub = mock.method(extender, 'senderFn' as any, () => Promise.reject(new Error('unit-test-error')) as any);

				await assert.rejects(() => extender.extendRoom('room-id', { _id: 'user-id' } as any), { message: 'unit-test-error' });

				_stub.mock.restore();
			});

			it('throws an instance of Error when senderFn throws a jsonrpc error', async () => {
				const _stub = mock.method(
					extender,
					'senderFn' as any,
					() => Promise.reject(jsonrpc.error('unit-test-error', new jsonrpc.JsonRpcError('unit-test-error', 1000))) as any,
				);

				await assert.rejects(() => extender.extendRoom('room-id', { _id: 'user-id' } as any), { message: 'unit-test-error' });

				_stub.mock.restore();
			});

			it('throws an instance of Error when senderFn throws an unknown value', async () => {
				const _stub = mock.method(extender, 'senderFn' as any, () => Promise.reject({}) as any);

				await assert.rejects(() => extender.extendRoom('room-id', { _id: 'user-id' } as any), { message: 'An unknown error occurred' });

				_stub.mock.restore();
			});
		});

		describe('extendVideoConference', () => {
			it('throws an instance of Error when senderFn throws an error', async () => {
				const _stub = mock.method(extender, 'senderFn' as any, () => Promise.reject(new Error('unit-test-error')) as any);

				await assert.rejects(() => extender.extendVideoConference('video-conference-id'), { message: 'unit-test-error' });

				_stub.mock.restore();
			});

			it('throws an instance of Error when senderFn throws a jsonrpc error', async () => {
				const _stub = mock.method(
					extender,
					'senderFn' as any,
					() => Promise.reject(jsonrpc.error('unit-test-error', new jsonrpc.JsonRpcError('unit-test-error', 1000))) as any,
				);

				await assert.rejects(() => extender.extendVideoConference('video-conference-id'), { message: 'unit-test-error' });

				_stub.mock.restore();
			});

			it('throws an instance of Error when senderFn throws an unknown value', async () => {
				const _stub = mock.method(extender, 'senderFn' as any, () => Promise.reject({}) as any);

				await assert.rejects(() => extender.extendVideoConference('video-conference-id'), { message: 'An unknown error occurred' });

				_stub.mock.restore();
			});
		});

		describe('finish', () => {
			it('throws an instance of Error when senderFn throws an error', async () => {
				const _stub = mock.method(extender, 'senderFn' as any, () => Promise.reject(new Error('unit-test-error')) as any);

				await assert.rejects(() => extender.finish({ kind: 'message', getMessage: () => ({}) } as any), { message: 'unit-test-error' });

				_stub.mock.restore();
			});

			it('throws an instance of Error when senderFn throws a jsonrpc error', async () => {
				const _stub = mock.method(
					extender,
					'senderFn' as any,
					() => Promise.reject(jsonrpc.error('unit-test-error', new jsonrpc.JsonRpcError('unit-test-error', 1000))) as any,
				);

				await assert.rejects(() => extender.finish({ kind: 'message', getMessage: () => ({}) } as any), { message: 'unit-test-error' });

				_stub.mock.restore();
			});

			it('throws an instance of Error when senderFn throws an unknown value', async () => {
				const _stub = mock.method(extender, 'senderFn' as any, () => Promise.reject({}) as any);

				await assert.rejects(() => extender.finish({ kind: 'message', getMessage: () => ({}) } as any), {
					message: 'An unknown error occurred',
				});

				_stub.mock.restore();
			});
		});
	});
});
