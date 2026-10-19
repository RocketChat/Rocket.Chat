import { css } from '@rocket.chat/css-in-js';

import { appendClassName } from './appendClassName';

describe('appendClassName', () => {
	it('returns the new class name when there is no current one', () => {
		expect(appendClassName(undefined, 'b')).toBe('b');
		expect(appendClassName('', 'b')).toBe('b');
	});

	it('appends to a string', () => {
		expect(appendClassName('a', 'b')).toBe('a b');
	});

	it('appends to an array', () => {
		expect(appendClassName(['a'], 'b')).toEqual(['a', 'b']);
	});

	it('keeps a css-in-js class name as a function', () => {
		const styles = css`
			color: red;
		`;

		expect(appendClassName(styles, 'b')).toEqual([styles, 'b']);
	});
});
