/* eslint-env mocha */
import { expect } from 'chai';

import { App } from '../types';
import { filterAppByCategories } from './filterAppByCategories';

describe('filterAppByCategories', () => {
	it('should return true if the app is in the categories', () => {
		const app = {
			categories: ['category1', 'category2'],
		};
		const categories = ['category1'];
		const result = filterAppByCategories(app as App, categories);
		expect(result).to.be.true;
	});
	it('should return false if the app is not in the categories', () => {
		const app = {
			categories: ['category1', 'category2'],
		};
		const categories = ['category3'];
		const result = filterAppByCategories(app as App, categories);
		expect(result).to.be.false;
	});
});
