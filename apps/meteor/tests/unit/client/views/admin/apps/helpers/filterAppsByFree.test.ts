/* eslint-env mocha */
import type { PurchaseType } from '@rocket.chat/core-typings';
import { expect } from 'chai';

import { filterAppsByFree } from '../../../../../../../client/views/admin/apps/helpers/filterAppsByFree';

describe('filterAppsByFree', () => {
	it('should return true if app purchase type is buy and price does not exist or is 0', () => {
		const purchaseType: PurchaseType = 'buy';
		const app = {
			purchaseType,
			price: 0,
		};
		const result = filterAppsByFree(app);
		expect(result).to.be.true;
	});
	it('should return false if app purchase type is not buy', () => {
		const purchaseType: PurchaseType = 'subscription';
		const app = {
			purchaseType,
			price: 0,
		};
		const result = filterAppsByFree(app);
		expect(result).to.be.false;
	});
	it('should return false if app price exists and is different than 0', () => {
		const purchaseType: PurchaseType = 'buy';
		const app = {
			purchaseType,
			price: 5,
		};
		const result = filterAppsByFree(app);
		expect(result).to.be.false;
	});
	it('should return false if both app purchase type is different than buy and price exists and is different than 0', () => {
		const purchaseType: PurchaseType = 'subscription';
		const app = {
			purchaseType,
			price: 5,
		};
		const result = filterAppsByFree(app);
		expect(result).to.be.false;
	});
});
