import { API_COUNT_LIMIT_DEFAULT } from '@rocket.chat/ui-contexts';

import { getApiCountLimit } from './getApiCountLimit';

const setInjectedLimit = (value: unknown): void => {
	(window as unknown as Record<string, unknown>).__API_COUNT_LIMIT__ = value;
};

describe('getApiCountLimit', () => {
	afterEach(() => {
		delete (window as unknown as Record<string, unknown>).__API_COUNT_LIMIT__;
	});

	it('should return the limit the server injected', () => {
		setInjectedLimit(20);

		expect(getApiCountLimit()).toBe(20);
	});

	it('should fall back to the default when the server injected nothing', () => {
		expect(getApiCountLimit()).toBe(API_COUNT_LIMIT_DEFAULT);
	});

	it.each([0, -5])('should fall back to the default when the injected limit is %p, which no page size can be', (value) => {
		setInjectedLimit(value);

		expect(getApiCountLimit()).toBe(API_COUNT_LIMIT_DEFAULT);
	});

	it.each([
		['a string', '20'],
		['a fraction', 12.5],
		['NaN', NaN],
		['Infinity', Infinity],
		['null', null],
	])('should fall back to the default when the injected limit is %s', (_label, value) => {
		setInjectedLimit(value);

		expect(getApiCountLimit()).toBe(API_COUNT_LIMIT_DEFAULT);
	});
});
