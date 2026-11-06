import { describe, it } from 'node:test';

import { isChatSendMessageProps } from '@rocket.chat/rest-typings';
import { expect } from 'chai';

import { assertValidMessageBlocks } from './assertValidMessageBlocks';

const text = { type: 'plain_text', text: 'hi' };

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
	'a button of an installed app': [
		{
			type: 'actions',
			appId: 'ce0e318b-ffc0-4ce4-832b-f1b464beb22a',
			elements: [{ type: 'button', appId: 'ce0e318b-ffc0-4ce4-832b-f1b464beb22a', text }],
		},
	],
	'a button of a core app': [{ type: 'actions', appId: 'videoconf-core', elements: [{ type: 'button', appId: 'videoconf-core', text }] }],
	'a linear scale with the default range': [{ type: 'actions', elements: [{ type: 'linear_scale' }] }],
	'a linear scale at the point limit': [{ type: 'actions', elements: [{ type: 'linear_scale', minValue: 1, maxValue: 100 }] }],
	'a linear scale with fractional bounds': [{ type: 'actions', elements: [{ type: 'linear_scale', minValue: 0.5, maxValue: 2.5 }] }],
	'a linear scale as a section accessory': [{ type: 'section', text, accessory: { type: 'linear_scale', maxValue: 5 } }],
};

describe('chat.sendMessage blocks schema', () => {
	Object.entries(accepted).forEach(([name, blocks]) => {
		it(`should accept ${name}`, () => {
			expect(isChatSendMessageProps({ message: { rid: 'rid', blocks } })).to.equal(true);
		});
	});

	const rejected: Record<string, unknown> = {
		'blocks that are not a list': { type: 'section' },
		'a block that is not an object': ['section'],
		'actions without elements': [{ type: 'actions' }],
		'actions with elements that are not a list': [{ type: 'actions', elements: 'x' }],
		'actions with an element that is null': [{ type: 'actions', elements: [null] }],
		'context without elements': [{ type: 'context' }],
		'a section with fields that contain null': [{ type: 'section', fields: [null] }],
		'an input without an element': [{ type: 'input' }],
	};

	Object.entries(rejected).forEach(([name, blocks]) => {
		it(`should reject ${name}`, () => {
			expect(isChatSendMessageProps({ message: { rid: 'rid', blocks } })).to.equal(false);
		});
	});

	it('should name the part of the blocks that is wrong', () => {
		isChatSendMessageProps({ message: { rid: 'rid', blocks: [{ type: 'divider' }, { type: 'actions' }] } });

		expect(isChatSendMessageProps.errors?.map(({ instancePath }) => instancePath)).to.include('/message/blocks/1');
	});
});

describe('assertValidMessageBlocks', () => {
	Object.entries(accepted).forEach(([name, blocks]) => {
		it(`should accept ${name}`, () => {
			expect(() => assertValidMessageBlocks(blocks)).to.not.throw();
		});
	});

	const rejected: Record<string, unknown> = {
		'a linear scale above the point limit': [{ type: 'actions', elements: [{ type: 'linear_scale', maxValue: 4294967295 }] }],
		'a linear scale with 101 points': [{ type: 'actions', elements: [{ type: 'linear_scale', minValue: 0, maxValue: 100 }] }],
		'a linear scale that is not numeric': [{ type: 'actions', elements: [{ type: 'linear_scale', maxValue: 'x' }] }],
		'a linear scale above the limit as a section accessory': [
			{ type: 'section', text, accessory: { type: 'linear_scale', maxValue: 4294967295 } },
		],
		'a block whose appId leaves the interaction path': [{ type: 'actions', appId: '../../v1/users.removeOtherTokens', elements: [] }],
		'an element whose appId leaves the interaction path': [
			{ type: 'actions', elements: [{ type: 'button', appId: '../../v1/users.removeOtherTokens', text }] },
		],
		'an appId that is not a string': [{ type: 'actions', elements: [{ type: 'button', appId: 42, text }] }],
		'an empty appId': [{ type: 'actions', elements: [{ type: 'button', appId: '', text }] }],
	};

	Object.entries(rejected).forEach(([name, blocks]) => {
		it(`should reject ${name}`, () => {
			expect(() => assertValidMessageBlocks(blocks)).to.throw(/^Invalid blocks: /);
		});
	});

	it('should reject blocks nested deeper than any block needs', () => {
		let node: Record<string, unknown> = { type: 'linear_scale' };
		for (let i = 0; i < 50; i++) {
			node = { type: 'wrapper', child: node };
		}

		expect(() => assertValidMessageBlocks([node])).to.throw('nested too deeply');
	});

	it('should name the part of the blocks that is wrong', () => {
		expect(() =>
			assertValidMessageBlocks([{ type: 'divider' }, { type: 'actions', elements: [{ type: 'linear_scale', maxValue: 'x' }] }]),
		).to.throw('blocks[1].elements[0]');
	});
});
