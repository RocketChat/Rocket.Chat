// deno-lint-ignore-file no-explicit-any
import { afterAll, beforeEach, describe, it } from 'https://deno.land/std@0.203.0/testing/bdd.ts';
import { assertSpyCall, spy, stub } from 'https://deno.land/std@0.203.0/testing/mock.ts';
import { assertRejects } from 'https://deno.land/std@0.203.0/assert/mod.ts';

import { AppObjectRegistry } from '../../../AppObjectRegistry.ts';
import { ModifyExtender } from '../modify/ModifyExtender.ts';
import jsonrpc from 'jsonrpc-lite';

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

	afterAll(() => {
		AppObjectRegistry.clear();
	});

	it('correctly formats requests for the extend message requests', async () => {
		const _spy = spy(extender, 'senderFn' as keyof ModifyExtender);

		const messageExtender = await extender.extendMessage('message-id', { _id: 'user-id' } as any);

		assertSpyCall(_spy, 0, {
			args: [
				{
					method: 'bridges:getMessageBridge:doGetById',
					params: ['message-id', 'deno-test'],
				},
			],
		});

		messageExtender.addCustomField('key', 'value');

		await extender.finish(messageExtender);

		assertSpyCall(_spy, 1, {
			args: [
				{
					method: 'bridges:getMessageBridge:doUpdate',
					params: [messageExtender.getMessage(), 'deno-test'],
				},
			],
		});

		_spy.restore();
	});

	it('correctly formats requests for the extend room requests', async () => {
		const _spy = spy(extender, 'senderFn' as keyof ModifyExtender);

		const roomExtender = await extender.extendRoom('room-id', { _id: 'user-id' } as any);

		assertSpyCall(_spy, 0, {
			args: [
				{
					method: 'bridges:getRoomBridge:doGetById',
					params: ['room-id', 'deno-test'],
				},
			],
		});

		roomExtender.addCustomField('key', 'value');

		await extender.finish(roomExtender);

		assertSpyCall(_spy, 1, {
			args: [
				{
					method: 'bridges:getRoomBridge:doUpdate',
					params: [roomExtender.getRoom(), [], 'deno-test'],
				},
			],
		});

		_spy.restore();
	});

	it('correctly formats requests for the extend video conference requests', async () => {
		const _spy = spy(extender, 'senderFn' as keyof ModifyExtender);

		const videoConferenceExtender = await extender.extendVideoConference('video-conference-id');

		assertSpyCall(_spy, 0, {
			args: [
				{
					method: 'bridges:getVideoConferenceBridge:doGetById',
					params: ['video-conference-id', 'deno-test'],
				},
			],
		});

		videoConferenceExtender.setStatus(4);

		await extender.finish(videoConferenceExtender);

		assertSpyCall(_spy, 1, {
			args: [
				{
					method: 'bridges:getVideoConferenceBridge:doUpdate',
					params: [videoConferenceExtender.getVideoConference(), 'deno-test'],
				},
			],
		});

		_spy.restore();
	});

	describe('Error Handling', () => {
		describe('extendMessage', () => {
			it('throws an instance of Error when senderFn throws an error', async () => {
				const _stub = stub(extender, 'senderFn' as keyof ModifyExtender, () => Promise.reject(new Error('unit-test-error')) as any);

				await assertRejects(() => extender.extendMessage('message-id', { _id: 'user-id' } as any), Error, 'unit-test-error');

				_stub.restore();
			});

			it('throws an instance of Error when senderFn throws a jsonrpc error', async () => {
				const _stub = stub(extender, 'senderFn' as keyof ModifyExtender, () => Promise.reject(jsonrpc.error('unit-test-error', new jsonrpc.JsonRpcError('unit-test-error', 1000))) as any);

				await assertRejects(() => extender.extendMessage('message-id', { _id: 'user-id' } as any), Error, 'unit-test-error');

				_stub.restore();
			});

			it('throws an instance of Error when senderFn throws an unknown value', async () => {
				const _stub = stub(extender, 'senderFn' as keyof ModifyExtender, () => Promise.reject({}) as any);

				await assertRejects(() => extender.extendMessage('message-id', { _id: 'user-id' } as any), Error, 'An unknown error occurred');

				_stub.restore();
			});
		});

		describe('extendRoom', () => {
			it('throws an instance of Error when senderFn throws an error', async () => {
				const _stub = stub(extender, 'senderFn' as keyof ModifyExtender, () => Promise.reject(new Error('unit-test-error')) as any);

				await assertRejects(() => extender.extendRoom('room-id', { _id: 'user-id' } as any), Error, 'unit-test-error');

				_stub.restore();
			});

			it('throws an instance of Error when senderFn throws a jsonrpc error', async () => {
				const _stub = stub(extender, 'senderFn' as keyof ModifyExtender, () => Promise.reject(jsonrpc.error('unit-test-error', new jsonrpc.JsonRpcError('unit-test-error', 1000))) as any);

				await assertRejects(() => extender.extendRoom('room-id', { _id: 'user-id' } as any), Error, 'unit-test-error');

				_stub.restore();
			});

			it('throws an instance of Error when senderFn throws an unknown value', async () => {
				const _stub = stub(extender, 'senderFn' as keyof ModifyExtender, () => Promise.reject({}) as any);

				await assertRejects(() => extender.extendRoom('room-id', { _id: 'user-id' } as any), Error, 'An unknown error occurred');

				_stub.restore();
			});
		});

		describe('extendVideoConference', () => {
			it('throws an instance of Error when senderFn throws an error', async () => {
				const _stub = stub(extender, 'senderFn' as keyof ModifyExtender, () => Promise.reject(new Error('unit-test-error')) as any);

				await assertRejects(() => extender.extendVideoConference('video-conference-id'), Error, 'unit-test-error');

				_stub.restore();
			});

			it('throws an instance of Error when senderFn throws a jsonrpc error', async () => {
				const _stub = stub(extender, 'senderFn' as keyof ModifyExtender, () => Promise.reject(jsonrpc.error('unit-test-error', new jsonrpc.JsonRpcError('unit-test-error', 1000))) as any);

				await assertRejects(() => extender.extendVideoConference('video-conference-id'), Error, 'unit-test-error');

				_stub.restore();
			});

			it('throws an instance of Error when senderFn throws an unknown value', async () => {
				const _stub = stub(extender, 'senderFn' as keyof ModifyExtender, () => Promise.reject({}) as any);

				await assertRejects(() => extender.extendVideoConference('video-conference-id'), Error, 'An unknown error occurred');

				_stub.restore();
			});
		});

		describe('finish', () => {
			it('throws an instance of Error when senderFn throws an error', async () => {
				const _stub = stub(extender, 'senderFn' as keyof ModifyExtender, () => Promise.reject(new Error('unit-test-error')) as any);

				await assertRejects(() => extender.finish({ kind: 'message', getMessage: () => ({})} as any), Error, 'unit-test-error');

				_stub.restore();
			});

			it('throws an instance of Error when senderFn throws a jsonrpc error', async () => {
				const _stub = stub(extender, 'senderFn' as keyof ModifyExtender, () => Promise.reject(jsonrpc.error('unit-test-error', new jsonrpc.JsonRpcError('unit-test-error', 1000))) as any);

				await assertRejects(() => extender.finish({ kind: 'message', getMessage: () => ({})} as any), Error, 'unit-test-error');

				_stub.restore();
			});

			it('throws an instance of Error when senderFn throws an unknown value', async () => {
				const _stub = stub(extender, 'senderFn' as keyof ModifyExtender, () => Promise.reject({}) as any);

				await assertRejects(() => extender.finish({ kind: 'message', getMessage: () => ({})} as any), Error, 'An unknown error occurred');

				_stub.restore();
			});
		});
	});
});
