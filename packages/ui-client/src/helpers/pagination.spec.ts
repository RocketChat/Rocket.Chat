import { getNextPageOffset, getPageSize } from './pagination';

describe('getNextPageOffset', () => {
	it.each([
		['continues after a full page', { offset: 0, count: 25, total: 100 }, 25],
		['continues after a page capped by the server', { offset: 50, count: 23, total: 100 }, 73],
		['stops after the last page', { offset: 92, count: 8, total: 100 }, undefined],
		['stops after an empty page', { offset: 25, count: 0, total: 100 }, undefined],
		['stops on an empty list', { offset: 0, count: 0, total: 0 }, undefined],
	])('%s', (_, page, expected) => {
		expect(getNextPageOffset(page)).toBe(expected);
	});
});

describe('getPageSize', () => {
	it.each([
		['lowers the page size to a short page that is not the last', 25, { offset: 0, count: 23, total: 100 }, 23],
		['keeps the page size on a full page', 23, { offset: 23, count: 23, total: 100 }, 23],
		['never raises the page size', 23, { offset: 0, count: 25, total: 100 }, 23],
		['keeps the page size on a short last page', 25, { offset: 75, count: 10, total: 85 }, 25],
		['keeps the page size on an empty page', 25, { offset: 25, count: 0, total: 100 }, 25],
	])('%s', (_, pageSize, page, expected) => {
		expect(getPageSize(pageSize, page)).toBe(expected);
	});
});
