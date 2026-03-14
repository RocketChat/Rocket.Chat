import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import type { IMessage } from '../../../../src/definition/messages';
import { MessageRead } from '../../../../src/server/accessors';
import type { MessageBridge } from '../../../../src/server/bridges';
import { TestData } from '../../../test-data/utilities';

describe('MessageRead', () => {
	const msg = TestData.getMessage();

	const mockMsgBridgeWithMsg = {
		doGetById(id: string, appId: string): Promise<IMessage> {
			return Promise.resolve(msg);
		},
	} as MessageBridge;

	const mockMsgBridgeNoMsg = {
		doGetById(id: string, appId: string): Promise<IMessage> {
			return Promise.resolve(undefined);
		},
	} as MessageBridge;

	it('expectDataFromMessageRead', async () => {
		assert.doesNotThrow(() => new MessageRead(mockMsgBridgeWithMsg, 'testing-app'));

		const mr = new MessageRead(mockMsgBridgeWithMsg, 'testing-app');

		assert.ok((await mr.getById('fake')) !== undefined);
		assert.deepStrictEqual(await mr.getById('fake'), msg);

		assert.ok((await mr.getSenderUser('fake')) !== undefined);
		assert.deepStrictEqual(await mr.getSenderUser('fake'), msg.sender);

		assert.ok((await mr.getRoom('fake')) !== undefined);
		assert.deepStrictEqual(await mr.getRoom('fake'), msg.room);
	});

	it('doNotExpectDataFromMessageRead', async () => {
		assert.doesNotThrow(() => new MessageRead(mockMsgBridgeNoMsg, 'testing'));

		const nomr = new MessageRead(mockMsgBridgeNoMsg, 'testing');
		assert.strictEqual(await nomr.getById('fake'), undefined);
		assert.strictEqual(await nomr.getSenderUser('fake'), undefined);
		assert.strictEqual(await nomr.getRoom('fake'), undefined);
	});
});
