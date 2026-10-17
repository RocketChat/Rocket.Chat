import { getCurrentCategory } from './helpers';

const categoriesIndexes = [
	{ key: 'recent', index: 0 },
	{ key: 'people', index: 10 },
	{ key: 'flags', index: 25 },
	{ key: 'rocket', index: 40 },
];

describe('getCurrentCategory function', () => {
	it('should return the first category when the list is scrolled to the top', () => {
		expect(getCurrentCategory(categoriesIndexes, 0, 8)).toEqual({ key: 'recent', index: 0 });
	});

	it('should return the category the first visible row belongs to', () => {
		expect(getCurrentCategory(categoriesIndexes, 5, 12)).toEqual({ key: 'recent', index: 0 });
		expect(getCurrentCategory(categoriesIndexes, 15, 22)).toEqual({ key: 'people', index: 10 });
		expect(getCurrentCategory(categoriesIndexes, 30, 37)).toEqual({ key: 'flags', index: 25 });
	});

	it('should keep the previous category while its divider is still the first visible row', () => {
		expect(getCurrentCategory(categoriesIndexes, 10, 18)).toEqual({ key: 'recent', index: 0 });
		expect(getCurrentCategory(categoriesIndexes, 25, 32)).toEqual({ key: 'people', index: 10 });
	});

	it('should return the last category once its divider is rendered', () => {
		expect(getCurrentCategory(categoriesIndexes, 33, 40)).toEqual({ key: 'rocket', index: 40 });
		expect(getCurrentCategory(categoriesIndexes, 41, 44)).toEqual({ key: 'rocket', index: 40 });
	});

	it('should not return the last category while its divider is still out of sight', () => {
		expect(getCurrentCategory(categoriesIndexes, 30, 39)).toEqual({ key: 'flags', index: 25 });
	});

	it('should return undefined when there are no categories', () => {
		expect(getCurrentCategory([], 0, 0)).toBeUndefined();
	});

	describe('when the whole list fits on screen', () => {
		const shortCategoriesIndexes = [
			{ key: 'recent', index: 0 },
			{ key: 'people', index: 3 },
			{ key: 'rocket', index: 6 },
		];

		it('should return the first category even though the last divider is already visible', () => {
			expect(getCurrentCategory(shortCategoriesIndexes, 0, 8)).toEqual({ key: 'recent', index: 0 });
		});

		it('should return the only category of a single category list', () => {
			expect(getCurrentCategory([{ key: 'recent', index: 0 }], 0, 8)).toEqual({ key: 'recent', index: 0 });
		});
	});
});
