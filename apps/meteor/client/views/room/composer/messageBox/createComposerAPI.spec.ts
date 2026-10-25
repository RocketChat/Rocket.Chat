import { createComposerAPI } from './createComposerAPI';
import { isLinePrefixButton } from '../../../../lib/messageBoxFormatting';
import { ORDERED_LINE_PREFIX, UNORDERED_LINE_PREFIX, toggleLinePrefix } from '../../../../lib/toggleLinePrefix';

jest.mock('../../../../lib/chats/uploads', () => ({
	createUploadsAPI: () => ({}),
}));

const setupComposer = (initialValue: string, cursor: { start: number; end: number }) => {
	const input = document.createElement('textarea');
	document.body.appendChild(input);

	const discardDraft = jest.fn();
	const composer = createComposerAPI(input, jest.fn(), discardDraft, '', Number.MAX_SAFE_INTEGER, { current: null }, { rid: 'GENERAL' });

	input.value = initialValue;
	input.setSelectionRange(cursor.start, cursor.end);

	return { composer, input, discardDraft };
};

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

describe('ChatMessages Composer API - wrapSelection', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('wraps each line of a multi-line selection with an inline marker', () => {
		const { composer, input } = setupComposer('This is\na test', { start: 0, end: 14 });

		composer.wrapSelection('*{{text}}*');

		expect(input.value).toBe('*This is*\n*a test*');
		expect(input.selectionStart).toBe(0);
		expect(input.selectionEnd).toBe('*This is*\n*a test*'.length);
	});

	it('unwraps the lines when the same marker is applied again', () => {
		const { composer, input } = setupComposer('This is\na test', { start: 0, end: 14 });

		composer.wrapSelection('_{{text}}_');
		composer.wrapSelection('_{{text}}_');

		expect(input.value).toBe('This is\na test');
	});

	it('unwraps every line when only the text inside a per-line formatted block is selected', () => {
		const { composer, input } = setupComposer('*foo*\n*bar*', { start: 1, end: 10 });

		composer.wrapSelection('*{{text}}*');

		expect(input.value).toBe('foo\nbar');
	});

	it('still wraps a multi-line selection as a whole with brackets', () => {
		const { composer, input } = setupComposer('foo\nbar', { start: 0, end: 7 });

		composer.wrapSelection('({{text}})');

		expect(input.value).toBe('(foo\nbar)');
	});

	it('still wraps a single line as before', () => {
		const { composer, input } = setupComposer('hello world', { start: 6, end: 11 });

		composer.wrapSelection('*{{text}}*');

		expect(input.value).toBe('hello *world*');
		expect(input.selectionStart).toBe(7);
		expect(input.selectionEnd).toBe(12);
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
