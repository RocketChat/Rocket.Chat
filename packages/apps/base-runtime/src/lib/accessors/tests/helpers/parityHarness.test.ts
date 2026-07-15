import * as assert from 'node:assert';
import { after, beforeEach, describe, it } from 'node:test';

import { createRecordingSender } from './parityHarness';
import { AppObjectRegistry } from '../../../../AppObjectRegistry';
import { ModifyExtender } from '../../modify/ModifyExtender';

describe('parityHarness', () => {
	beforeEach(() => {
		AppObjectRegistry.clear();
		AppObjectRegistry.set('id', 'deno-test');
	});

	after(() => {
		AppObjectRegistry.clear();
	});

	it('records every emitted request in order, with method and params', async () => {
		const { sender, emitted } = createRecordingSender();

		await sender({ method: 'bridges:getMessageBridge:doGetById', params: ['a', 'APP_ID'] });
		await sender({ method: 'bridges:getRoomBridge:doUpdate', params: [{ id: 'r' }, [], 'APP_ID'] });

		assert.deepStrictEqual(emitted(), [
			{ method: 'bridges:getMessageBridge:doGetById', params: ['a', 'APP_ID'] },
			{ method: 'bridges:getRoomBridge:doUpdate', params: [{ id: 'r' }, [], 'APP_ID'] },
		]);
	});

	it('resolves canned responses by method (value or function) and defaults to null', async () => {
		const { sender } = createRecordingSender({
			'bridges:getMessageBridge:doGetById': { id: 'msg-1', text: 'hi' },
			'bridges:getMessageBridge:doCreate': (call) => (call.params[0] as { text: string }).text,
		});

		const got = await sender({ method: 'bridges:getMessageBridge:doGetById', params: ['msg-1', 'APP_ID'] });
		assert.deepStrictEqual(got.result, { id: 'msg-1', text: 'hi' });

		const created = await sender({ method: 'bridges:getMessageBridge:doCreate', params: [{ text: 'echoed' }, 'APP_ID'] });
		assert.strictEqual(created.result, 'echoed');

		const uncanned = await sender({ method: 'bridges:getRoomBridge:doGetById', params: ['r', 'APP_ID'] });
		assert.strictEqual(uncanned.result, null);
	});

	it('pins the host-bound traffic a MOVE-style accessor emits (worked example: ModifyExtender.extendMessage + finish)', async () => {
		const { sender, emitted } = createRecordingSender({
			'bridges:getMessageBridge:doGetById': { id: 'message-id', text: 'original' },
		});

		const extender = new ModifyExtender(sender);

		const messageExtender = await extender.extendMessage('message-id', { id: 'user-id' } as any);
		messageExtender.addCustomField('key', 'value');
		await extender.finish(messageExtender);

		// This is the parity assertion a Phase 1-2 port must keep satisfying: the
		// exact ordered bridge traffic *and* its params, normalized to the APP_ID
		// sentinel.
		const calls = emitted();
		assert.deepStrictEqual(
			calls.map((c) => c.method),
			['bridges:getMessageBridge:doGetById', 'bridges:getMessageBridge:doUpdate'],
		);

		// extendMessage looks the message up by id; the caller identity is the APP_ID sentinel.
		assert.deepStrictEqual(calls[0].params, ['message-id', 'APP_ID']);

		// finish writes the mutated message back, again trailed by the APP_ID sentinel.
		// (editedAt is a fresh Date, so we assert the fields the accessor is responsible for.)
		const [updatedMessage, appId] = calls[1].params as [Record<string, unknown>, string];
		assert.strictEqual(appId, 'APP_ID');
		assert.strictEqual(updatedMessage.id, 'message-id');
		assert.deepStrictEqual(updatedMessage.editor, { id: 'user-id' });
		assert.deepStrictEqual(updatedMessage.customFields, { key: 'value' });
	});
});
