import { checkBlockLimits } from './blockLimits';

const text = (length: number) => ({ type: 'plain_text', text: 'a'.repeat(length) });
const paths = (blocks: unknown, maxBlocks = 50) => checkBlockLimits(blocks, maxBlocks).map(({ path }) => path);

it('accepts blocks at their limits and values that are not blocks', () => {
	expect(
		paths([
			{ type: 'header', text: text(150) },
			{ type: 'section', text: text(3000), fields: [text(2000)], accessory: { type: 'button', text: text(75) } },
			{ type: 'input', label: text(2000), hint: text(2000), element: { type: 'plain_text_input', placeholder: text(150) } },
			{ type: 'bogus' },
		]),
	).toEqual([]);
	expect(paths(undefined)).toEqual([]);
	expect(paths('text')).toEqual([]);
});

it('limits the blocks of a message and of a view', () => {
	const blocks = Array.from({ length: 51 }, () => ({ type: 'divider' }));

	expect(paths(blocks)).toEqual(['$input']);
	expect(paths(blocks, 100)).toEqual([]);
});

it.each([
	['header text', { type: 'header', text: text(151) }, '$input[0].text.text'],
	['section text', { type: 'section', text: text(3001) }, '$input[0].text.text'],
	['section field', { type: 'section', fields: [text(2001)] }, '$input[0].fields[0].text'],
	['button text', { type: 'section', accessory: { type: 'button', text: text(76) } }, '$input[0].accessory.text.text'],
	['alert text', { type: 'alert', text: text(201) }, '$input[0].text.text'],
	['input label', { type: 'input', label: text(2001), element: {} }, '$input[0].label.text'],
	['input hint', { type: 'input', hint: text(2001), element: {} }, '$input[0].hint.text'],
	['placeholder', { type: 'input', element: { type: 'plain_text_input', placeholder: text(151) } }, '$input[0].element.placeholder.text'],
	[
		'option text',
		{ type: 'actions', elements: [{ type: 'static_select', options: [{ text: text(76), value: 'a' }] }] },
		'$input[0].elements[0].options[0].text.text',
	],
])('limits the %s', (_, block, path) => {
	expect(paths([block])).toEqual([path]);
});

it('limits the options of a select and the elements of an actions block', () => {
	const options = Array.from({ length: 101 }, (_, index) => ({ text: text(1), value: String(index) }));
	const elements = Array.from({ length: 26 }, () => ({ type: 'button', text: text(1) }));

	expect(paths([{ type: 'actions', elements: [{ type: 'static_select', options }] }])).toEqual(['$input[0].elements[0].options']);
	expect(paths([{ type: 'actions', elements }])).toEqual(['$input[0].elements']);
	expect(paths([{ type: 'context', elements }])).toEqual([]);
});
