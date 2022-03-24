/* eslint-env mocha */
import { expect } from 'chai';

import { filterAppsByPaid } from '../../../../../../../client/views/admin/apps/helpers/filterAppsByPaid';

describe('filterAppsByPaid', () => {
	it('should return true if both app purchase type is subscription and app price exists and is not 0', () => {
		const app = {
			purchaseType: 'subscription',
			price: 5,
		};
		const result = filterAppsByPaid(app);
		expect(result).to.be.true;
	});
	it('should return true if app purchase type is subscription', () => {
		const app = {
			purchaseType: 'subscription',
			price: 0,
		};
		const result = filterAppsByPaid(app);
		expect(result).to.be.true;
	});
	it('should return true if app price exists and is not 0', () => {
		const app = {
			purchaseType: 'buy',
			price: 5,
		};
		const result = filterAppsByPaid(app);
		expect(result).to.be.true;
	});
	it('should return false if both app price does not exist or is 0 and app purchase type is not subscription', () => {
		const app = {
			purchaseType: 'buy',
			price: 0,
		};
		const result = filterAppsByPaid(app);
		expect(result).to.be.false;
	});
});
