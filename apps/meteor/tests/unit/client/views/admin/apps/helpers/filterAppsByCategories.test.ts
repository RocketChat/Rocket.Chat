/* eslint-env mocha */
import { expect } from 'chai';

import { filterAppsByCategories } from '../../../../../../../client/views/marketplace/helpers/filterAppsByCategories';
import type { App } from '../../../../../../../client/views/marketplace/types';

describe('filterAppsByCategories', () => {
	it('should return true if the app is in the categories', () => {
		const app = {
			categories: ['category1', 'category2'],
		};
		const categories = ['category1'];
		const result = filterAppsByCategories(app as App, categories);
		expect(result).to.be.true;
	});
	it('should return false if the app is not in the categories', () => {
		const app = {
			categories: ['category1', 'category2'],
		};
		const categories = ['category3'];
		const result = filterAppsByCategories(app as App, categories);
		expect(result).to.be.false;
	});
});
