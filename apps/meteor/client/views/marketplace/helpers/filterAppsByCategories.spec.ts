import type { App } from '../types';
import { filterAppsByCategories } from './filterAppsByCategories';

describe('filterAppsByCategories', () => {
	it('should return true if the app is in the categories', () => {
		const app = {
			categories: ['category1', 'category2'],
		};
		const categories = ['category1'];
		const result = filterAppsByCategories(app as App, categories);
		expect(result).toBe(true);
	});

	it('should return false if the app is not in the categories', () => {
		const app = {
			categories: ['category1', 'category2'],
		};
		const categories = ['category3'];
		const result = filterAppsByCategories(app as App, categories);
		expect(result).toBe(false);
	});
});
