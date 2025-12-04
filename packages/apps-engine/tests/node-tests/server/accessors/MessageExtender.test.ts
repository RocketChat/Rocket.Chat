import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import type { IMessage } from '../../../../src/definition/messages';
import { MessageExtender } from '../../../../src/server/accessors';
import { TestData } from '../../../test-data/utilities';

describe('MessageExtender', () => {
	it('basicMessageExtender', () => {
		assert.doesNotThrow(() => new MessageExtender({} as IMessage));
		assert.doesNotThrow(() => new MessageExtender(TestData.getMessage()));
	});

	it('usingMessageExtender', () => {
		const msg: IMessage = {} as IMessage;
		const me = new MessageExtender(msg);

		assert.ok(msg.attachments !== undefined);
		assert.strictEqual(msg.attachments.length, 0);
		assert.strictEqual(me.addCustomField('thing', 'value'), me);
		assert.ok(msg.customFields !== undefined);
		assert.strictEqual(msg.customFields.thing, 'value');
		assert.throws(
			() => me.addCustomField('thing', 'second'),
			{
				name: 'Error',
				message: 'The message already contains a custom field by the key: thing',
			},
		);
		assert.throws(
			() => me.addCustomField('thing.', 'second'),
			{
				name: 'Error',
				message: 'The given key contains a period, which is not allowed. Key: thing.',
			},
		);

		assert.strictEqual(me.addAttachment({}), me);
		assert.strictEqual(msg.attachments.length, 1);
		assert.strictEqual(me.addAttachments([{ collapsed: true }, { color: '#f00' }]), me);
		assert.strictEqual(msg.attachments.length, 3);

		assert.notStrictEqual(me.getMessage(), msg);
		assert.deepStrictEqual(me.getMessage(), msg);
	});
});
