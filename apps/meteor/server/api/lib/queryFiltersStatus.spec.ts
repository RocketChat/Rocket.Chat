import { expect } from 'chai';

import { queryFiltersStatus } from './queryFiltersStatus';

describe('queryFiltersStatus', () => {
	it('should return false for a query without status fields', () => {
		expect(queryFiltersStatus({ username: { $regex: 'ana' } })).to.be.equal(false);
	});

	it('should return true for a top level status filter', () => {
		expect(queryFiltersStatus({ status: 'online' })).to.be.equal(true);
	});

	it('should return true for a status filter nested in $or', () => {
		expect(queryFiltersStatus({ $or: [{ username: { $regex: '' } }, { status: 'online' }] })).to.be.equal(true);
	});

	it('should return true for a status filter nested in $and inside $or', () => {
		expect(queryFiltersStatus({ $or: [{ $and: [{ statusText: { $regex: 'lunch' } }] }] })).to.be.equal(true);
	});

	it('should return true for any redacted status field', () => {
		for (const field of ['statusText', 'statusSource', 'statusExpiresAt', 'statusDefault', 'statusConnection']) {
			expect(queryFiltersStatus({ [field]: { $exists: true } })).to.be.equal(true);
		}
	});

	it('should return false for null and primitive values', () => {
		expect(queryFiltersStatus(null)).to.be.equal(false);
		expect(queryFiltersStatus('status')).to.be.equal(false);
		expect(queryFiltersStatus(undefined)).to.be.equal(false);
	});
});
