import { wrapSelectionText } from './wrapSelectionText';

type Range = { start: number; end: number };

// The same cases the DOM wrapSelection is held to in createComposerAPI.wrapSelection.spec.ts.
const cases: ReadonlyArray<{
	name: string;
	text: string;
	selection: Range;
	pattern: string;
	expected: { text: string; selection: Range; toggledOff: boolean };
}> = [
	{
		name: 'wrap the selected text and keep it selected',
		text: 'say hello now',
		selection: { start: 4, end: 9 },
		pattern: '*{{text}}*',
		expected: { text: 'say *hello* now', selection: { start: 5, end: 10 }, toggledOff: false },
	},
	{
		name: 'wrap an empty selection and place the caret between the markers',
		text: 'say  now',
		selection: { start: 4, end: 4 },
		pattern: '_{{text}}_',
		expected: { text: 'say __ now', selection: { start: 5, end: 5 }, toggledOff: false },
	},
	{
		name: 'wrap at the very start of the text',
		text: 'hello',
		selection: { start: 0, end: 5 },
		pattern: '~{{text}}~',
		expected: { text: '~hello~', selection: { start: 1, end: 6 }, toggledOff: false },
	},
	{
		name: 'wrap with a multi-line fence',
		text: 'code',
		selection: { start: 0, end: 4 },
		pattern: '```\n{{text}}\n```',
		expected: { text: '```\ncode\n```', selection: { start: 4, end: 8 }, toggledOff: false },
	},
	{
		name: 'toggle off when both markers surround the selection',
		text: 'say *hello* now',
		selection: { start: 5, end: 10 },
		pattern: '*{{text}}*',
		expected: { text: 'say hello now', selection: { start: 4, end: 9 }, toggledOff: true },
	},
	{
		name: 'toggle off a multi-line fence',
		text: '```\ncode\n```',
		selection: { start: 4, end: 8 },
		pattern: '```\n{{text}}\n```',
		expected: { text: 'code', selection: { start: 0, end: 4 }, toggledOff: true },
	},
	{
		name: 'wrap again when only the opening marker is present',
		text: 'say *hello now',
		selection: { start: 5, end: 10 },
		pattern: '*{{text}}*',
		expected: { text: 'say **hello* now', selection: { start: 6, end: 11 }, toggledOff: false },
	},
	{
		name: 'expand a replacement token in the selected text as String.replace does',
		text: 'cost $& total',
		selection: { start: 5, end: 7 },
		pattern: '`{{text}}`',
		expected: { text: 'cost `{{text}}` total', selection: { start: 6, end: 8 }, toggledOff: false },
	},
];

describe('wrapSelectionText', () => {
	it.each(cases)('should $name', ({ text, selection, pattern, expected }) => {
		const result = wrapSelectionText(text, selection, pattern);

		expect(result).toMatchObject(expected);
	});

	it.each(cases)('should describe the replaced span for the case: $name', ({ text, selection, pattern }) => {
		const { text: result, replacement } = wrapSelectionText(text, selection, pattern);

		expect(text.slice(0, replacement.start) + replacement.text + text.slice(replacement.end)).toBe(result);
	});
});
