import { ariaAndDataAttributes } from './ariaAndDataAttributes';

it('keeps every aria-* and data-* attribute and nothing else', () => {
	const props = { 'aria-label': 'Save', 'aria-colcount': 2, 'data-qa': 'save', 'className': 'mine', 'onPress': () => undefined };

	expect(ariaAndDataAttributes(props)).toEqual({ 'aria-label': 'Save', 'aria-colcount': 2, 'data-qa': 'save' });
});

it('renders the testID as data-testid', () => {
	expect(ariaAndDataAttributes({ testID: 'save' })).toEqual({ 'data-testid': 'save' });
});

it('lets a data-testid the consumer passed win over the testID', () => {
	expect(ariaAndDataAttributes({ 'testID': 'save', 'data-testid': 'legacy' })).toEqual({ 'data-testid': 'legacy' });
});

it('keeps the attributes in the order the consumer passed them, the testID first', () => {
	const attributes = ariaAndDataAttributes({ 'data-b': 1, 'testID': 'save', 'aria-a': 2 });

	expect(Object.keys(attributes)).toEqual(['data-testid', 'data-b', 'aria-a']);
});

it('keeps an attribute whose value is undefined, as the consumer passed it', () => {
	const attributes = ariaAndDataAttributes({ 'aria-label': undefined, 'data-qa': null });

	expect(attributes).toEqual({ 'aria-label': undefined, 'data-qa': null });
	expect(Object.keys(attributes)).toEqual(['aria-label', 'data-qa']);
});

it('ignores a key that only contains the prefix, and an undefined testID', () => {
	expect(ariaAndDataAttributes({ testID: undefined, aria: 1, data: 2, ariaLabel: 3, dataQa: 4 })).toEqual({});
});

it('returns an empty object for no props', () => {
	expect(ariaAndDataAttributes({})).toEqual({});
});

describe('output matches the implementation it replaced', () => {
	const reference = (props: { testID?: string }): Record<string, unknown> => {
		const attributes: Record<string, unknown> = {};
		if (props.testID !== undefined) {
			attributes['data-testid'] = props.testID;
		}
		for (const [key, value] of Object.entries(props)) {
			if (key.startsWith('aria-') || key.startsWith('data-')) {
				attributes[key] = value;
			}
		}
		return attributes;
	};

	const table: Record<string, unknown>[] = [
		{},
		{ testID: 'a' },
		{ testID: undefined },
		{ 'testID': 'a', 'data-testid': 'b' },
		{ 'data-testid': 'b', 'testID': 'a' },
		{ 'aria-label': 'x', 'data-qa': 'y', 'className': 'z', 'onPress': () => undefined, 'children': 'c' },
		{ 'aria-label': undefined, 'data-qa': null, 'aria-hidden': false, 'aria-colcount': 0 },
		{ aria: 1, data: 2, ariaLabel: 3, dataQa: 4, id: 'i' },
		{ 'z-1': 1, 'data-z': 1, 'aria-a': 1, 'data-a': 2 },
		{ 1: 'numeric', 'aria-x': 'y' },
	];

	it.each(table.map((props, index) => [index, props] as const))('table row %#', (_, props) => {
		const expected = reference(props);
		const actual = ariaAndDataAttributes(props);

		expect(actual).toEqual(expected);
		expect(Object.keys(actual)).toEqual(Object.keys(expected));
	});
});
