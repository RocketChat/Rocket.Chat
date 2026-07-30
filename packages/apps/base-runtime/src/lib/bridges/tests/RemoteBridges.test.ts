import * as assert from 'node:assert';
import { describe, it, mock } from 'node:test';

import { RemoteBridges } from '../RemoteBridges';

// Mimics the resolved shape of Messenger.sendRequest: a JSON-RPC SuccessObject
// whose `result` field carries the payload.
const senderFn = (result: unknown) =>
	Promise.resolve({
		id: 'test',
		jsonrpc: '2.0' as const,
		result,
		serialize() {
			return JSON.stringify(this);
		},
	});

describe('RemoteBridges', () => {
	it('encodes a do* call as a bridges:<bridge>:<method> request with the given params verbatim', async () => {
		const spy = mock.fn(senderFn);
		const bridges = new RemoteBridges(spy as any);

		await bridges.getMessageBridge().doGetById('msg-1', 'APP_ID');

		assert.deepStrictEqual(spy.mock.calls[0].arguments, [
			{
				method: 'bridges:getMessageBridge:doGetById',
				params: ['msg-1', 'APP_ID'],
			},
		]);
	});

	it('does not inject APP_ID - identity params are passed through exactly as provided', async () => {
		const spy = mock.fn(senderFn);
		const bridges = new RemoteBridges(spy as any);

		// An app-supplied argument-appId (ModerationBridge style) must survive raw.
		await bridges.getModerationBridge().doReport('msg-1', 'spam', 'user-1', 'some-other-app');

		assert.deepStrictEqual(spy.mock.calls[0].arguments, [
			{
				method: 'bridges:getModerationBridge:doReport',
				params: ['msg-1', 'spam', 'user-1', 'some-other-app'],
			},
		]);
	});

	it('unwraps the SuccessObject result for the caller', async () => {
		const bridges = new RemoteBridges((() => senderFn({ id: 'created' })) as any);

		const result = await bridges.getRoomBridge().doCreate({ displayName: 'test' });

		assert.deepStrictEqual(result, { id: 'created' });
	});

	it('routes every getter to its matching bridge name', async () => {
		const spy = mock.fn(senderFn);
		const bridges = new RemoteBridges(spy as any);

		const cases: Array<[keyof RemoteBridges, string]> = [
			['getMessageBridge', 'getMessageBridge'],
			['getRoomBridge', 'getRoomBridge'],
			['getUserBridge', 'getUserBridge'],
			['getLivechatBridge', 'getLivechatBridge'],
			['getVideoConferenceBridge', 'getVideoConferenceBridge'],
			['getHttpBridge', 'getHttpBridge'],
			['getInternalBridge', 'getInternalBridge'],
			['getPersistenceBridge', 'getPersistenceBridge'],
			['getUploadBridge', 'getUploadBridge'],
			['getCloudWorkspaceBridge', 'getCloudWorkspaceBridge'],
			['getOAuthAppsBridge', 'getOAuthAppsBridge'],
			['getContactBridge', 'getContactBridge'],
			['getThreadBridge', 'getThreadBridge'],
			['getRoleBridge', 'getRoleBridge'],
			['getExperimentalBridge', 'getExperimentalBridge'],
			['getServerSettingBridge', 'getServerSettingBridge'],
			['getEnvironmentalVariableBridge', 'getEnvironmentalVariableBridge'],
			['getSchedulerBridge', 'getSchedulerBridge'],
			['getModerationBridge', 'getModerationBridge'],
			['getEmailBridge', 'getEmailBridge'],
			['getUiInteractionBridge', 'getUiInteractionBridge'],
		];

		for (const [getter] of cases) {
			await (bridges[getter]() as any).doPing();
		}

		cases.forEach(([, bridgeName], index) => {
			assert.strictEqual((spy.mock.calls[index].arguments[0] as any).method, `bridges:${bridgeName}:doPing`);
		});
	});

	it('throws synchronously when a non-do* method is accessed (mirrors the host gate, fails fast)', () => {
		const bridges = new RemoteBridges(senderFn as any);
		const bridge = bridges.getMessageBridge() as any;

		assert.throws(() => bridge.getById, {
			message: 'Invalid bridge method "getById" on "getMessageBridge": only "do*" methods can be called',
		});
	});

	it('is not thenable and does not throw on incidental inspection', () => {
		const bridges = new RemoteBridges(senderFn as any);
		const bridge = bridges.getMessageBridge() as any;

		assert.strictEqual(bridge.then, undefined);
		assert.strictEqual(bridge.toJSON, undefined);
		assert.strictEqual(bridge[Symbol.iterator], undefined);
	});

	it('maps a JSON-RPC error object into an Error carrying the same message', async () => {
		const bridges = new RemoteBridges((() => Promise.reject({ error: { message: 'bridge failed', code: -32000 } })) as any);

		await assert.rejects(() => bridges.getMessageBridge().doCreate({}), { message: 'bridge failed' });
	});

	it('passes an existing Error through unchanged', async () => {
		const original = new Error('network down');
		const bridges = new RemoteBridges((() => Promise.reject(original)) as any);

		await assert.rejects(() => bridges.getMessageBridge().doCreate({}), { message: 'network down' });
	});

	it('wraps an unknown rejection value with the default message', async () => {
		const bridges = new RemoteBridges((() => Promise.reject('nope')) as any);

		await assert.rejects(() => bridges.getMessageBridge().doCreate({}), { message: 'An unknown error occurred' });
	});
});
