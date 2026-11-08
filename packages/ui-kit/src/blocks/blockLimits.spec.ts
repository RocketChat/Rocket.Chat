import { checkBlockLimits } from './blockLimits';

const text = (length: number) => ({ type: 'plain_text', text: 'a'.repeat(length) });
const paths = (blocks: unknown, maxBlocks = 50, options: { maxCharts?: number } = { maxCharts: 2 }) =>
	checkBlockLimits(blocks, maxBlocks, options).map(({ path }) => path);

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

describe('data_table', () => {
	const cell = (value: string) => ({ type: 'raw_text', text: value });
	const table = (rows: unknown[][], extra: object = {}) => [{ type: 'data_table', caption: 'Table', rows, ...extra }];
	const header = [cell('A'), cell('B')];
	const row = [cell('a'), cell('b')];

	it('accepts a table at its limits', () => {
		const wide = Array.from({ length: 20 }, () => cell('a'));

		expect(paths(table([header, ...Array.from({ length: 200 }, () => row)], { page_size: 100, row_header_column_index: 1 }))).toEqual([]);
		expect(paths(table([wide, wide]))).toEqual([]);
	});

	it('limits the rows, columns and the length of every row', () => {
		expect(paths(table([header]))).toEqual(['$input[0].rows']);
		expect(paths(table([header, ...Array.from({ length: 201 }, () => row)]))).toEqual(['$input[0].rows']);
		expect(paths(table([[], []]))).toEqual(['$input[0].rows[0]']);
		expect(paths(table([Array.from({ length: 21 }, () => cell('a')), header]))).toEqual(['$input[0].rows[0]', '$input[0].rows[1]']);
		expect(paths(table([header, [cell('a')]]))).toEqual(['$input[0].rows[1]']);
	});

	it('keeps rich text and buttons out of the header', () => {
		const rich = { type: 'rich_text', elements: [] };
		const action = { type: 'action_cell', element: { type: 'button', text: text(1) } };

		expect(paths(table([[rich, action], row]))).toEqual(['$input[0].rows[0][0]', '$input[0].rows[0][1]']);
		expect(paths(table([header, [rich, action]]))).toEqual([]);
	});

	it('limits the characters of all cells, counting button text and the shown text of a number', () => {
		const long = (length: number) => [cell('a'.repeat(length)), cell('')];
		const action = { type: 'action_cell', element: { type: 'button', text: text(75) } };
		const full = Array.from({ length: 19 }, () => long(1000));

		const number = (extra: object) => [{ type: 'raw_number', value: 123456, ...extra }, cell('')];

		expect(paths(table([header, ...full, long(998)]))).toEqual([]);
		expect(paths(table([header, ...full, long(999)]))).toEqual(['$input[0].rows']);
		expect(paths(table([header, ...full, long(950), [action, cell('')]]))).toEqual(['$input[0].rows']);
		expect(paths(table([header, ...full, long(900), [action, cell('')]]))).toEqual([]);
		expect(paths(table([header, ...full, long(995), number({})]))).toEqual(['$input[0].rows']);
		expect(paths(table([header, ...full, long(995), number({ text: 'n' })]))).toEqual([]);
	});

	it('limits the text of a button in a cell', () => {
		const action = { type: 'action_cell', element: { type: 'button', text: text(76) } };

		expect(paths(table([header, [action, cell('a')]]))).toEqual(['$input[0].rows[1][0].element.text.text']);
	});

	it('validates the page size and the row header column', () => {
		expect(paths(table([header, row], { page_size: 0 }))).toEqual(['$input[0].page_size']);
		expect(paths(table([header, row], { page_size: 101 }))).toEqual(['$input[0].page_size']);
		expect(paths(table([header, row], { page_size: 1.5 }))).toEqual(['$input[0].page_size']);
		expect(paths(table([header, row], { row_header_column_index: 2 }))).toEqual(['$input[0].row_header_column_index']);
		expect(paths(table([header, row], { row_header_column_index: -1 }))).toEqual(['$input[0].row_header_column_index']);
	});
});

describe('data_visualization', () => {
	const point = (label: string, value = 1) => ({ label, value });
	const chart = (type: string, series: unknown[], axis: object = { categories: ['a', 'b'] }) => ({
		type: 'data_visualization',
		title: 'Chart',
		chart: { type, series, axis_config: axis },
	});
	const valid = (extra: object = {}) => ({ name: 'one', data: [point('a'), point('b', -2)], ...extra });
	const withCategories = (categories: string[]) =>
		chart('bar', [{ name: 'one', data: categories.map((label) => point(label)) }], { categories });
	const pie = (segments: unknown[]) => ({ type: 'data_visualization', title: 'Pie', chart: { type: 'pie', segments } });

	it('accepts charts at their limits', () => {
		const categories = Array.from({ length: 20 }, (_, index) => `${index}`.padEnd(20, 'x'));
		const series = Array.from({ length: 12 }, (_, index) => ({
			name: `${index}`.padEnd(20, 'x'),
			data: categories.map((label) => point(label)),
		}));

		expect(
			paths([{ ...chart('bar', series, { categories, x_label: 'x'.repeat(50), y_label: 'y'.repeat(50) }), title: 't'.repeat(50) }]),
		).toEqual([]);
		expect(
			paths([chart('line', [valid()]), pie(Array.from({ length: 12 }, (_, index) => ({ label: 'l'.repeat(20), value: index + 0.5 })))]),
		).toEqual([]);
	});

	it.each([
		['title', { ...chart('bar', [valid()]), title: 't'.repeat(51) }, '$input[0].title'],
		['pie without segments', pie([]), '$input[0].chart.segments'],
		['pie with 13 segments', pie(Array.from({ length: 13 }, () => ({ label: 'a', value: 1 }))), '$input[0].chart.segments'],
		['segment label', pie([{ label: 'a'.repeat(21), value: 1 }]), '$input[0].chart.segments[0].label'],
		['segment value of 0', pie([{ label: 'a', value: 0 }]), '$input[0].chart.segments[0].value'],
		['segment negative value', pie([{ label: 'a', value: -1 }]), '$input[0].chart.segments[0].value'],
		['no series', chart('area', []), '$input[0].chart.series'],
		[
			'13 series',
			chart(
				'area',
				Array.from({ length: 13 }, (_, index) => valid({ name: `s${index}` })),
			),
			'$input[0].chart.series',
		],
		['series name', chart('bar', [valid({ name: 'n'.repeat(21) })]), '$input[0].chart.series[0].name'],
		['duplicated series name', chart('bar', [valid(), valid()]), '$input[0].chart.series[1].name'],
		['no categories', chart('bar', [valid({ data: [] })], { categories: [] }), '$input[0].chart.axis_config.categories'],
		['21 categories', withCategories(Array.from({ length: 21 }, (_, index) => `${index}`)), '$input[0].chart.axis_config.categories'],
		['category label', withCategories(['a', 'c'.repeat(21)]), '$input[0].chart.axis_config.categories[1]'],
		['x_label', chart('bar', [valid()], { categories: ['a', 'b'], x_label: 'x'.repeat(51) }), '$input[0].chart.axis_config.x_label'],
		['y_label', chart('bar', [valid()], { categories: ['a', 'b'], y_label: 'y'.repeat(51) }), '$input[0].chart.axis_config.y_label'],
		['a missing point', chart('line', [valid({ data: [point('a')] })]), '$input[0].chart.series[0].data'],
		['a point outside the categories', chart('line', [valid({ data: [point('a'), point('z')] })]), '$input[0].chart.series[0].data'],
		['a repeated point', chart('line', [valid({ data: [point('a'), point('a')] })]), '$input[0].chart.series[0].data'],
	])('limits the %s', (_, block, path) => {
		expect(paths([block])).toEqual([path]);
	});

	it('reports duplicated categories and duplicated point labels', () => {
		expect(paths([chart('bar', [valid()], { categories: ['a', 'a'] })])).toContain('$input[0].chart.axis_config.categories');
		expect(paths([chart('line', [valid({ data: [point('a'), point('a')] })])])).toEqual(['$input[0].chart.series[0].data']);
	});

	it('stays fast on a payload far past the limits', () => {
		const categories = Array.from({ length: 50000 }, (_, index) => `c${index}`);
		const series = [{ name: 'one', data: [...categories].reverse().map((label) => point(label)) }];
		const start = performance.now();
		const result = paths([chart('bar', series, { categories })]);

		expect(performance.now() - start).toBeLessThan(200);
		expect(result).toContain('$input[0].chart.axis_config.categories');
		expect(result).not.toContain('$input[0].chart.series[0].data');
	});

	it('counts a conditional block as the largest block it renders', () => {
		const dividers = { type: 'conditional', render: [{ type: 'divider' }, { type: 'divider' }] };
		const nested = {
			type: 'conditional',
			render: [{ type: 'divider' }, { type: 'container', title: 't', child_blocks: [{ type: 'divider' }, { type: 'divider' }] }],
		};

		expect(paths([dividers], 1)).toEqual([]);
		expect(paths([nested], 3)).toEqual([]);
		expect(paths([nested], 2)).toEqual(['$input']);
		expect(paths([nested, nested], 5)).toEqual(['$input']);
	});

	it('counts the charts a conditional block renders', () => {
		const conditional = { type: 'conditional', render: [chart('bar', [valid()])] };

		expect(paths([conditional, conditional, conditional])).toEqual(['$input']);
	});

	it('allows 2 charts in a message and any number in a view', () => {
		const charts = [chart('bar', [valid()]), chart('bar', [valid()]), chart('bar', [valid()])];

		expect(paths(charts.slice(0, 2))).toEqual([]);
		expect(paths(charts)).toEqual(['$input']);
		expect(paths(charts, 100, {})).toEqual([]);
		expect(paths(charts, 50, { maxCharts: 3 })).toEqual([]);
	});
});

describe('container and layout blocks', () => {
	const divider = { type: 'divider' };
	const container = (children: unknown[] = [divider], extra: object = {}) => ({
		type: 'container',
		title: text(10),
		child_blocks: children,
		...extra,
	});
	const item = (block: unknown, width?: string) => ({ block, ...(width && { width }) });
	const layout = (rows: unknown[], extra: object = {}) => ({ type: 'layout', label: 'Summary', rows, ...extra });
	const row = (...items: unknown[]) => ({ items });
	const chart = { type: 'data_visualization', title: 'c', chart: { type: 'pie', segments: [{ label: 'a', value: 1 }] } };

	it.each([
		['a title', container([divider], { title: text(151) }), '$input[0].title.text'],
		['a subtitle', container([divider], { subtitle: text(151) }), '$input[0].subtitle.text'],
		['no children', container([]), '$input[0].child_blocks'],
		['11 children', container(Array.from({ length: 11 }, () => divider)), '$input[0].child_blocks'],
		['no title', { type: 'container', child_blocks: [divider] }, '$input[0]'],
		[
			'an icon URL',
			container([divider], { icon: { type: 'image', image_url: 'a'.repeat(3001), alt_text: 'a' } }),
			'$input[0].icon.image_url',
		],
		['a layout label', layout([row(item(divider))], { label: 'l'.repeat(151) }), '$input[0].label'],
		['no rows', layout([]), '$input[0].rows'],
		['6 rows', layout(Array.from({ length: 6 }, () => row(item(divider)))), '$input[0].rows'],
		['no items', layout([row()]), '$input[0].rows[0].items'],
		['4 items', layout([row(...Array.from({ length: 4 }, () => item(divider)))]), '$input[0].rows[0].items'],
	])('limits %s', (_, block, path) => {
		expect(paths([block])).toEqual([path]);
	});

	it('accepts either title, and a container with 10 children', () => {
		expect(paths([container(Array.from({ length: 10 }, () => divider))])).toEqual([]);
		expect(paths([{ type: 'container', rich_text_title: { type: 'rich_text', elements: [] }, child_blocks: [divider] }])).toEqual([]);
	});

	it('allows two levels of layout and container and rejects a third', () => {
		const inner = layout([row(item(divider))]);

		expect(paths([layout([row(item(container()))])])).toEqual([]);
		expect(paths([container([inner])])).toEqual([]);
		expect(paths([layout([row(item(container([inner])))])])).toEqual(['$input[0].rows[0].items[0].block.child_blocks[0]']);
		expect(paths([container([layout([row(item(container([inner])))])])])).toEqual([
			'$input[0].child_blocks[0].rows[0].items[0].block',
			'$input[0].child_blocks[0].rows[0].items[0].block.child_blocks[0]',
		]);
	});

	it('keeps a carousel, a data table and a data visualization apart', () => {
		const carousel = { type: 'carousel', elements: [{ type: 'card' }] };
		const table = { type: 'data_table', rows: [[{ type: 'raw_text', text: 'a' }], [{ type: 'raw_text', text: 'b' }]] };

		expect(paths([layout([row(item(carousel), item(divider))])])).toEqual([]);
		expect(paths([layout([row(item(carousel), item(table))])])).toEqual(['$input[0].rows[0].items']);
		expect(paths([layout([row(item(table), item(chart, 'wide'))])])).toEqual(['$input[0].rows[0].items']);
	});

	it('gives a data visualization more than half of the row', () => {
		const chartPaths = (...items: unknown[]) => paths([layout([row(...items)])]);

		expect(chartPaths(item(chart))).toEqual([]);
		expect(chartPaths(item(chart, 'wide'), item(divider))).toEqual([]);
		expect(chartPaths(item(chart), item(divider))).toEqual(['$input[0].rows[0].items[0]']);
		expect(chartPaths(item(chart, 'narrow'), item(divider, 'wide'))).toEqual(['$input[0].rows[0].items[0]']);
	});

	it('counts the blocks nested in a layout or container toward the budget', () => {
		const nested = [layout([row(item(divider), item(divider)), row(item(divider))]), container([divider, divider])];

		expect(paths(nested, 7)).toEqual([]);
		expect(paths(nested, 6)).toEqual(['$input']);
	});

	it('counts the charts nested in a layout toward the limit per message', () => {
		expect(paths([layout([row(item(chart))]), layout([row(item(chart))]), layout([row(item(chart))])])).toEqual(['$input']);
	});

	it('limits the text of nested blocks', () => {
		expect(paths([container([{ type: 'header', text: text(151) }])])).toEqual(['$input[0].child_blocks[0].text.text']);
	});
});
