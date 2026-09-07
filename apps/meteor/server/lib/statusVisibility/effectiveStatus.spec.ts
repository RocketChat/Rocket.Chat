import { UserStatus } from '@rocket.chat/core-typings';
import { expect } from 'chai';

import { effectiveStatusExpression, effectiveStatusFilter, excludingOfflineFilter } from './effectiveStatus';
import type { PresenceScope } from './presenceScope';

const nobody: PresenceScope = { hideAll: false };
const hiding = (...ids: string[]): PresenceScope => ({ hideAll: false, hidden: new Set(ids) });
const everyone: PresenceScope = { hideAll: true };

describe('effectiveStatusFilter', () => {
	it('should filter by the stored status when nobody is hidden', () => {
		expect(effectiveStatusFilter([UserStatus.ONLINE], nobody)).to.be.deep.equal({ status: { $in: [UserStatus.ONLINE] } });
		expect(effectiveStatusFilter([UserStatus.ONLINE], { hideAll: false, hidden: new Set() })).to.be.deep.equal({
			status: { $in: [UserStatus.ONLINE] },
		});
	});

	it('should exclude hidden users from a filter that does not include offline', () => {
		expect(effectiveStatusFilter([UserStatus.ONLINE, UserStatus.BUSY], hiding('alice'))).to.be.deep.equal({
			$and: [{ _id: { $nin: ['alice'] } }, { status: { $in: [UserStatus.ONLINE, UserStatus.BUSY] } }],
		});
	});

	it('should include every hidden user in a filter that includes offline, whatever their stored status', () => {
		expect(effectiveStatusFilter([UserStatus.ONLINE, UserStatus.OFFLINE], hiding('alice'))).to.be.deep.equal({
			$or: [{ _id: { $nin: ['alice'] }, status: { $in: [UserStatus.ONLINE, UserStatus.OFFLINE] } }, { _id: { $in: ['alice'] } }],
		});
	});

	it('should match everyone when the whole workspace is hidden and the filter includes offline', () => {
		expect(effectiveStatusFilter([UserStatus.ONLINE, UserStatus.OFFLINE], everyone)).to.be.deep.equal({});
	});

	it('should match nobody when the whole workspace is hidden and the filter excludes offline', () => {
		const filter = effectiveStatusFilter([UserStatus.ONLINE], everyone);

		expect(filter).to.not.have.property('_id');
		expect(Object.keys(filter)).to.have.lengthOf(1);
	});

	it('should survive being merged into a query that already constrains _id', () => {
		const merged = { _id: { $in: ['alice', 'bob'] }, ...effectiveStatusFilter([UserStatus.ONLINE], everyone) };

		expect(merged._id).to.be.deep.equal({ $in: ['alice', 'bob'] });
		expect(Object.keys(merged)).to.have.lengthOf(2);
	});
});

describe('effectiveStatusExpression', () => {
	it('should resolve hidden users to offline and leave everyone else untouched', () => {
		expect(effectiveStatusExpression(hiding('alice', 'bob'))).to.be.deep.equal({
			$cond: [{ $in: ['$_id', ['alice', 'bob']] }, UserStatus.OFFLINE, '$status'],
		});
	});

	it('should project the stored status when nobody is hidden', () => {
		expect(effectiveStatusExpression(nobody)).to.be.equal('$status');
	});

	it('should project a constant offline when the whole workspace is hidden', () => {
		expect(effectiveStatusExpression(everyone)).to.be.equal(UserStatus.OFFLINE);
	});
});

describe('excludingOfflineFilter', () => {
	it('should leave hidden users out, whatever their stored status', () => {
		expect(excludingOfflineFilter(nobody)).to.be.deep.equal({ status: { $ne: UserStatus.OFFLINE } });
		expect(excludingOfflineFilter(hiding('alice'))).to.be.deep.equal({
			$and: [{ _id: { $nin: ['alice'] } }, { status: { $ne: UserStatus.OFFLINE } }],
		});
	});

	it('should match nobody when the whole workspace is hidden', () => {
		expect(excludingOfflineFilter(everyone)).to.not.be.deep.equal({ status: { $ne: UserStatus.OFFLINE } });
		expect(Object.keys(excludingOfflineFilter(everyone))).to.have.lengthOf(1);
	});
});
