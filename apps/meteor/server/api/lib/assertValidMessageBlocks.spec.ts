import { isChatSendMessageProps } from '@rocket.chat/rest-typings';
import { expect } from 'chai';
import { describe, it } from 'mocha';

import { assertValidMessageBlocks } from './assertValidMessageBlocks';

const assertSendableBlocks = (blocks: unknown): void => {
	if (!isChatSendMessageProps({ message: { rid: 'rid', blocks } })) {
		throw new Error(`Invalid blocks: ${JSON.stringify(isChatSendMessageProps.errors)}`);
	}

	assertValidMessageBlocks(blocks);
};

describe('assertValidMessageBlocks', () => {
	const text = { type: 'plain_text', text: 'hi' };

	describe('blocks the renderer can walk', () => {
		const accepted: Record<string, unknown> = {
			'no blocks': undefined,
			'null blocks': null,
			'an empty list': [],
			'a section': [{ type: 'section', text }],
			'a section with fields': [{ type: 'section', fields: [text, text] }],
			'a divider': [{ type: 'divider' }],
			'actions with a button': [{ type: 'actions', elements: [{ type: 'button', text, actionId: 'a' }] }],
			'actions with no elements': [{ type: 'actions', elements: [] }],
			'context with elements': [{ type: 'context', elements: [text] }],
			'an input with an element': [{ type: 'input', label: text, element: { type: 'plain_text_input', actionId: 'a' } }],
			'a block type the renderer does not know': [{ type: 'unknown-type' }],
			'a block without a type': [{}],
			'a linear scale with the default range': [{ type: 'actions', elements: [{ type: 'linear_scale' }] }],
			'a linear scale at the point limit': [{ type: 'actions', elements: [{ type: 'linear_scale', minValue: 1, maxValue: 100 }] }],
			'a linear scale as a section accessory': [{ type: 'section', text, accessory: { type: 'linear_scale', maxValue: 5 } }],
		};

		Object.entries(accepted).forEach(([name, blocks]) => {
			it(`should accept ${name}`, () => {
				expect(() => assertSendableBlocks(blocks)).to.not.throw();
			});
		});
	});

	describe('blocks that make the renderer fail', () => {
		const rejected: Record<string, unknown> = {
			'blocks that are not a list': { type: 'section' },
			'a block that is not an object': ['section'],
			'actions without elements': [{ type: 'actions' }],
			'actions with elements that are not a list': [{ type: 'actions', elements: 'x' }],
			'actions with an element that is null': [{ type: 'actions', elements: [null] }],
			'context without elements': [{ type: 'context' }],
			'a section with fields that contain null': [{ type: 'section', fields: [null] }],
			'an input without an element': [{ type: 'input' }],
			'a linear scale above the point limit': [{ type: 'actions', elements: [{ type: 'linear_scale', maxValue: 4294967295 }] }],
			'a linear scale with 101 points': [{ type: 'actions', elements: [{ type: 'linear_scale', minValue: 0, maxValue: 100 }] }],
			'a linear scale that is not numeric': [{ type: 'actions', elements: [{ type: 'linear_scale', maxValue: 'x' }] }],
			'a linear scale above the limit as a section accessory': [
				{ type: 'section', text, accessory: { type: 'linear_scale', maxValue: 4294967295 } },
			],
		};

		Object.entries(rejected).forEach(([name, blocks]) => {
			it(`should reject ${name}`, () => {
				expect(() => assertSendableBlocks(blocks)).to.throw(/^Invalid blocks: /);
			});
		});

		it('should reject blocks nested deeper than any block needs', () => {
			let node: Record<string, unknown> = { type: 'linear_scale' };
			for (let i = 0; i < 50; i++) {
				node = { type: 'wrapper', child: node };
			}

			expect(() => assertSendableBlocks([node])).to.throw('nested too deeply');
		});
	});

	it('should name the part of the blocks that is wrong', () => {
		expect(() => assertSendableBlocks([{ type: 'divider' }, { type: 'actions' }])).to.throw('/message/blocks/1');
	});
});
