/* eslint-env mocha */
import { expect } from 'chai';

import { App } from '../types';
import { filterAppByCategory } from './filterAppByCategory';

describe('filterAppByCategory', () => {
	it('should return true if the app is in the category', () => {
		const app = {
			categories: ['category1', 'category2'],
		};
		const category = 'category1';
		const result = filterAppByCategory(app as App, category);
		expect(result).to.be.true;
	});
	it('should return false if the app is not in the category', () => {
		const app = {
			categories: ['category1', 'category2'],
		};
		const category = 'category3';
		const result = filterAppByCategory(app as App, category);
		expect(result).to.be.false;
	});
});
