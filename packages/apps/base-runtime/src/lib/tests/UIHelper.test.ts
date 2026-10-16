import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import type { LayoutBlock } from '@rocket.chat/ui-kit';

import { UIHelper } from '../UIHelper';

describe('UIHelper.assignIds', () => {
	it('assigns an actionId to the elements of an actions block, a section accessory and an input element', () => {
		const blocks = [
			{ type: 'actions', elements: [{ type: 'button', text: { type: 'plain_text', text: 'Go' } }] },
			{ type: 'section', text: { type: 'plain_text', text: 'Pick' }, accessory: { type: 'users_select' } },
			{ type: 'input', label: { type: 'plain_text', text: 'Name' }, element: { type: 'plain_text_input' } },
		] as unknown as LayoutBlock[];

		const [actions, section, input] = UIHelper.assignIds(blocks, 'app-id') as any[];

		for (const block of [actions, section, input]) {
			assert.strictEqual(block.appId, 'app-id');
			assert.ok(block.blockId);
		}
		assert.ok(actions.elements[0].actionId);
		assert.ok(section.accessory.actionId);
		assert.ok(input.element.actionId);
	});

	it('keeps the ids the app already set', () => {
		const blocks = [
			{ type: 'section', blockId: 'b', appId: 'other', accessory: { type: 'button', actionId: 'kept' } },
		] as unknown as LayoutBlock[];

		const [section] = UIHelper.assignIds(blocks, 'app-id') as any[];

		assert.strictEqual(section.appId, 'other');
		assert.strictEqual(section.blockId, 'b');
		assert.strictEqual(section.accessory.actionId, 'kept');
	});
});
