import { ariaAndDataAttributes } from './ariaAndDataAttributes';

describe('ariaAndDataAttributes', () => {
	it('keeps every aria and data attribute and nothing else', () => {
		expect(ariaAndDataAttributes({ 'aria-label': 'a', 'data-x': 1, 'id': 'i', 'onClick': () => undefined, 'aria': 1, 'data': 2 })).toEqual({
			'aria-label': 'a',
			'data-x': 1,
		});
	});

	it('returns an empty object when the props have none', () => {
		expect(ariaAndDataAttributes({ id: 'i' })).toEqual({});
	});
});
