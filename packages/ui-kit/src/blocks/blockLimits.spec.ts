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
	['card title', { type: 'card', title: text(151) }, '$input[0].title.text'],
	['card subtitle', { type: 'card', subtitle: text(151) }, '$input[0].subtitle.text'],
	['card body', { type: 'card', body: text(201) }, '$input[0].body.text'],
	['card subtext', { type: 'card', subtext: text(201) }, '$input[0].subtext.text'],
	['card image URL', { type: 'card', icon: { type: 'image', image_url: 'a'.repeat(3001), alt_text: 'a' } }, '$input[0].icon.image_url'],
	[
		'card image alt text',
		{ type: 'card', hero_image: { type: 'image', image_url: 'a', alt_text: 'a'.repeat(2001) } },
		'$input[0].hero_image.alt_text',
	],
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

it('limits the buttons of a card and the cards of a carousel', () => {
	const actions = Array.from({ length: 4 }, () => ({ type: 'button', text: text(1) }));
	const cards = Array.from({ length: 11 }, () => ({ type: 'card' }));

	expect(paths([{ type: 'card', actions }])).toEqual(['$input[0].actions']);
	expect(paths([{ type: 'card', actions: actions.slice(1) }])).toEqual([]);
	expect(paths([{ type: 'carousel', elements: cards }])).toEqual(['$input[0].elements']);
	expect(paths([{ type: 'carousel', elements: [] }])).toEqual(['$input[0].elements']);
	expect(paths([{ type: 'carousel', elements: [{ type: 'card', title: text(151) }] }])).toEqual(['$input[0].elements[0].title.text']);
});
