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

	it('assigns ids to blocks and elements nested in container, layout, conditional, carousel and data_table blocks', () => {
		const button = () => ({ type: 'button', text: { type: 'plain_text', text: 'Go' } });
		const actions = () => ({ type: 'actions', elements: [button()] });
		const blocks = [
			{ type: 'container', child_blocks: [actions()] },
			{ type: 'layout', rows: [{ items: [{ block: actions() }, null] }], fallback: [actions()] },
			{ type: 'conditional', render: [actions()] },
			{ type: 'carousel', elements: [{ type: 'card', actions: [button()] }] },
			{ type: 'data_table', rows: [[{ type: 'raw_text', text: 'A' }], [{ type: 'action_cell', element: button() }]] },
		] as unknown as LayoutBlock[];

		const [container, layout, conditional, carousel, table] = UIHelper.assignIds(blocks, 'app-id') as any[];
		const nested = [container.child_blocks[0], layout.rows[0].items[0].block, layout.fallback[0], conditional.render[0]];

		for (const block of nested) {
			assert.strictEqual(block.appId, 'app-id');
			assert.ok(block.blockId);
			assert.ok(block.elements[0].actionId);
		}
		assert.strictEqual(carousel.elements[0].appId, 'app-id');
		assert.ok(carousel.elements[0].actions[0].actionId);
		assert.ok(table.rows[1][0].element.actionId);
	});
});
