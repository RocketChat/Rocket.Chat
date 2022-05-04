/* eslint-env mocha */
import { expect } from 'chai';

import { App } from '../../../../../../../client/views/admin/apps/types';
import { filterAppsByCategory } from '../../../../../../../client/views/admin/apps/helpers/filterAppsByCategory';

describe('filterAppsByCategory', () => {
	it('should return true if the app is in the category', () => {
		const app = {
			categories: ['category1', 'category2'],
		};
		const category = 'category1';
		const result = filterAppsByCategory(app as App, category);
		expect(result).to.be.true;
	});
	it('should return false if the app is not in the category', () => {
		const app = {
			categories: ['category1', 'category2'],
		};
		const category = 'category3';
		const result = filterAppsByCategory(app as App, category);
		expect(result).to.be.false;
	});
});
