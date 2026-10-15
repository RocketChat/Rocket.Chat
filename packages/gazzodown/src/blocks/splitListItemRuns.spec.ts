import { isOrderedListRun, splitListItemRuns } from './splitListItemRuns';

const item = (number?: number) =>
	({
		type: 'LIST_ITEM' as const,
		value: [],
		...(number !== undefined ? { number } : {}),
	}) as const;

describe('splitListItemRuns', () => {
	it('keeps a homogeneous ordered run together', () => {
		const runs = splitListItemRuns([item(1), item(2)]);
		expect(runs).toHaveLength(1);
		expect(isOrderedListRun(runs[0])).toBe(true);
	});

	it('keeps a homogeneous unordered run together', () => {
		const runs = splitListItemRuns([item(), item()]);
		expect(runs).toHaveLength(1);
		expect(isOrderedListRun(runs[0])).toBe(false);
	});

	it('splits mixed ordered/unordered siblings into separate runs', () => {
		const runs = splitListItemRuns([item(1), item(), item(2), item(3)]);
		expect(runs).toEqual([[item(1)], [item()], [item(2), item(3)]]);
	});
});
