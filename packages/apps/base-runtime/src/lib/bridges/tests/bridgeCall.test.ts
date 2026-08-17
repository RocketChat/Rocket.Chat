import * as assert from 'node:assert';
import { describe, it, mock } from 'node:test';

import { bridgeCall, type BridgeName } from '../bridgeCall';

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

describe('bridgeCall', () => {
	it('encodes a call as a bridges:<bridge>:<method> request with the given params verbatim', async () => {
		const spy = mock.fn(senderFn);

		await bridgeCall(spy as any, 'getMessageBridge', 'doGetById', 'msg-1', 'APP_ID');

		assert.deepStrictEqual(spy.mock.calls[0].arguments, [
			{
				method: 'bridges:getMessageBridge:doGetById',
				params: ['msg-1', 'APP_ID'],
			},
		]);
	});

	it('does not inject APP_ID - identity params are passed through exactly as provided', async () => {
		const spy = mock.fn(senderFn);

		// An app-supplied argument-appId (ModerationBridge style) must survive raw.
		await bridgeCall(spy as any, 'getModerationBridge', 'doReport', 'msg-1', 'spam', 'user-1', 'some-other-app');

		assert.deepStrictEqual(spy.mock.calls[0].arguments, [
			{
				method: 'bridges:getModerationBridge:doReport',
				params: ['msg-1', 'spam', 'user-1', 'some-other-app'],
			},
		]);
	});

	it('unwraps the SuccessObject result for the caller', async () => {
		const result = await bridgeCall((() => senderFn({ id: 'created' })) as any, 'getRoomBridge', 'doCreate', { displayName: 'test' });

		assert.deepStrictEqual(result, { id: 'created' });
	});

	it('routes every bridge name to its matching request method', async () => {
		const spy = mock.fn(senderFn);

		const bridges: BridgeName[] = [
			'getMessageBridge',
			'getRoomBridge',
			'getUserBridge',
			'getLivechatBridge',
			'getVideoConferenceBridge',
			'getHttpBridge',
			'getInternalBridge',
			'getPersistenceBridge',
			'getUploadBridge',
			'getCloudWorkspaceBridge',
			'getOAuthAppsBridge',
			'getContactBridge',
			'getThreadBridge',
			'getRoleBridge',
			'getExperimentalBridge',
			'getServerSettingBridge',
			'getEnvironmentalVariableBridge',
			'getSchedulerBridge',
			'getModerationBridge',
			'getEmailBridge',
			'getUiInteractionBridge',
			'getAppResourceBridge',
		];

		for (const bridge of bridges) {
			await bridgeCall(spy as any, bridge, 'doPing');
		}

		bridges.forEach((bridge, index) => {
			assert.strictEqual((spy.mock.calls[index].arguments[0] as any).method, `bridges:${bridge}:doPing`);
		});
	});

	it('maps a JSON-RPC error object into an Error carrying the same message', async () => {
		const sender = (() => Promise.reject({ error: { message: 'bridge failed', code: -32000 } })) as any;

		await assert.rejects(() => bridgeCall(sender, 'getMessageBridge', 'doCreate', {}), { message: 'bridge failed' });
	});

	it('passes an existing Error through unchanged', async () => {
		const original = new Error('network down');
		const sender = (() => Promise.reject(original)) as any;

		await assert.rejects(() => bridgeCall(sender, 'getMessageBridge', 'doCreate', {}), { message: 'network down' });
	});

	it('wraps an unknown rejection value with the default message', async () => {
		const sender = (() => Promise.reject('nope')) as any;

		await assert.rejects(() => bridgeCall(sender, 'getMessageBridge', 'doCreate', {}), { message: 'An unknown error occurred' });
	});
});
