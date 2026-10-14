import { after, afterEach, before, describe, it, mock } from 'node:test';

import { expect } from 'expect';
import { fn } from 'jest-mock';
import type { FunctionLike } from 'jest-mock';

import { enterModuleScope, leaveModuleScope } from '../../../../../tests/mocks/moduleScope';

let createComposerAPI: (typeof import('./createComposerAPI'))['createComposerAPI'];
let isLinePrefixButton: (typeof import('../../../../lib/messageBoxFormatting'))['isLinePrefixButton'];
let ORDERED_LINE_PREFIX: (typeof import('../../../../lib/toggleLinePrefix'))['ORDERED_LINE_PREFIX'];
let UNORDERED_LINE_PREFIX: (typeof import('../../../../lib/toggleLinePrefix'))['UNORDERED_LINE_PREFIX'];
let toggleLinePrefix: (typeof import('../../../../lib/toggleLinePrefix'))['toggleLinePrefix'];

const setupComposer = (initialValue: string, cursor: { start: number; end: number }) => {
	const input = document.createElement('textarea');
	document.body.appendChild(input);

	const discardDraft = fn<FunctionLike>();
	const composer = createComposerAPI(
		input,
		fn<FunctionLike>(),
		discardDraft,
		'',
		Number.MAX_SAFE_INTEGER,
		{ current: null },
		{ rid: 'GENERAL' },
	);

	input.value = initialValue;
	input.setSelectionRange(cursor.start, cursor.end);

	return { composer, input, discardDraft };
};

describe('createComposerAPI', () => {
	before(() => {
		enterModuleScope();
		mock.module('../../../../lib/chats/uploads', {
			exports: {
				createUploadsAPI: () => ({}),
			},
		});
		({ createComposerAPI } = require('./createComposerAPI'));
		({ isLinePrefixButton } = require('../../../../lib/messageBoxFormatting'));
		({ ORDERED_LINE_PREFIX, UNORDERED_LINE_PREFIX, toggleLinePrefix } = require('../../../../lib/toggleLinePrefix'));
	});

	after(leaveModuleScope);

	describe('ChatMessages Composer API - replaceText', () => {
		afterEach(() => {
			document.body.innerHTML = '';
		});

		it('should place the cursor right after the mention when inserting at the start of the message', () => {
			const { composer, input } = setupComposer('@jhello', { start: 2, end: 2 });

			composer.replaceText('@john ', { start: 0, end: 2 });

			expect(input.value).toBe('@john hello');
			expect(input.selectionStart).toBe('@john '.length);
			expect(input.selectionEnd).toBe('@john '.length);
		});

		it('should place the cursor right after the mention when inserting in the middle of the message', () => {
			const { composer, input } = setupComposer('hi @jthere', { start: 5, end: 5 });

			composer.replaceText('@john ', { start: 3, end: 5 });

			expect(input.value).toBe('hi @john there');
			expect(input.selectionStart).toBe('hi @john '.length);
			expect(input.selectionEnd).toBe('hi @john '.length);
		});

		it('should place the cursor right after the mention when inserting at the end of the message', () => {
			const { composer, input } = setupComposer('hello @j', { start: 8, end: 8 });

			composer.replaceText('@john ', { start: 6, end: 8 });

			expect(input.value).toBe('hello @john ');
			expect(input.selectionStart).toBe('hello @john '.length);
			expect(input.selectionEnd).toBe('hello @john '.length);
		});

		it('should keep the cursor collapsed right after the inserted text', () => {
			const { composer, input } = setupComposer('@jhello', { start: 2, end: 2 });

			composer.replaceText('@john ', { start: 0, end: 2 });

			expect(input.selectionStart).toBe(input.selectionEnd);
		});
	});

	describe('ChatMessages Composer API - clear', () => {
		afterEach(() => {
			document.body.innerHTML = '';
		});

		it('should discard the stored draft, since clearing means the text was consumed', () => {
			const { composer, discardDraft } = setupComposer('a message', { start: 0, end: 0 });

			composer.clear();

			expect(discardDraft).toHaveBeenCalledTimes(1);
		});
	});

	describe('ChatMessages Composer API - line prefixes', () => {
		afterEach(() => {
			document.body.innerHTML = '';
		});

		it('should offer the list buttons', () => {
			const { composer } = setupComposer('', { start: 0, end: 0 });

			expect(composer.formatters.get().filter(isLinePrefixButton)).toHaveLength(2);
		});

		it('should write the bullets as plain text', () => {
			const { composer, input } = setupComposer('one\ntwo', { start: 0, end: 7 });

			toggleLinePrefix(composer, UNORDERED_LINE_PREFIX);

			expect(input.value).toBe('- one\n- two');
		});

		it('should write the numbers as plain text', () => {
			const { composer, input } = setupComposer('one\ntwo', { start: 0, end: 7 });

			toggleLinePrefix(composer, ORDERED_LINE_PREFIX);

			expect(input.value).toBe('1. one\n2. two');
		});
	});
});
