import { createComposerAPI } from './createComposerAPI';

jest.mock('../../../../lib/chats/uploads', () => ({
	createUploadsAPI: () => ({}),
}));

type Range = { start: number; end: number };

const cases: ReadonlyArray<{
	name: string;
	text: string;
	selection: Range;
	pattern: string;
	expected: { text: string; selection: Range };
}> = [
	{
		name: 'wrap the selected text and keep it selected',
		text: 'say hello now',
		selection: { start: 4, end: 9 },
		pattern: '*{{text}}*',
		expected: { text: 'say *hello* now', selection: { start: 5, end: 10 } },
	},
	{
		name: 'wrap an empty selection and place the caret between the markers',
		text: 'say  now',
		selection: { start: 4, end: 4 },
		pattern: '_{{text}}_',
		expected: { text: 'say __ now', selection: { start: 5, end: 5 } },
	},
	{
		name: 'wrap at the very start of the text',
		text: 'hello',
		selection: { start: 0, end: 5 },
		pattern: '~{{text}}~',
		expected: { text: '~hello~', selection: { start: 1, end: 6 } },
	},
	{
		name: 'wrap with a multi-line fence',
		text: 'code',
		selection: { start: 0, end: 4 },
		pattern: '```\n{{text}}\n```',
		expected: { text: '```\ncode\n```', selection: { start: 4, end: 8 } },
	},
	{
		name: 'toggle off when both markers surround the selection',
		text: 'say *hello* now',
		selection: { start: 5, end: 10 },
		pattern: '*{{text}}*',
		expected: { text: 'say hello now', selection: { start: 4, end: 9 } },
	},
	{
		name: 'toggle off a multi-line fence',
		text: '```\ncode\n```',
		selection: { start: 4, end: 8 },
		pattern: '```\n{{text}}\n```',
		expected: { text: 'code', selection: { start: 0, end: 4 } },
	},
	{
		name: 'wrap again when only the opening marker is present',
		text: 'say *hello now',
		selection: { start: 5, end: 10 },
		pattern: '*{{text}}*',
		expected: { text: 'say **hello* now', selection: { start: 6, end: 11 } },
	},
	{
		name: 'expand a replacement token in the selected text as String.replace does',
		text: 'cost $& total',
		selection: { start: 5, end: 7 },
		pattern: '`{{text}}`',
		expected: { text: 'cost `{{text}}` total', selection: { start: 6, end: 8 } },
	},
];

describe('ChatMessages Composer API - wrapSelection', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it.each(cases)('should $name', ({ text, selection, pattern, expected }) => {
		const input = document.createElement('textarea');
		document.body.appendChild(input);
		const composer = createComposerAPI(input, jest.fn(), jest.fn(), '', Number.MAX_SAFE_INTEGER, { current: null }, { rid: 'GENERAL' });

		input.value = text;
		input.setSelectionRange(selection.start, selection.end);

		const result = composer.wrapSelection(pattern);

		expect(input.value).toBe(expected.text);
		expect(input.selectionStart).toBe(expected.selection.start);
		expect(input.selectionEnd).toBe(expected.selection.end);
		expect(result).toEqual({ value: expected.text, selectionStart: expected.selection.start, selectionEnd: expected.selection.end });
	});
});
