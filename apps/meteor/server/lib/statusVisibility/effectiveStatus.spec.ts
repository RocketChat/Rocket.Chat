import { UserStatus } from '@rocket.chat/core-typings';
import { expect } from 'chai';

import { effectiveStatusExpression, effectiveStatusFilter, excludingOfflineFilter } from './effectiveStatus';

describe('effectiveStatusFilter', () => {
	it('should filter by the stored status when nobody is hidden', () => {
		expect(effectiveStatusFilter([UserStatus.ONLINE])).to.be.deep.equal({ status: { $in: [UserStatus.ONLINE] } });
		expect(effectiveStatusFilter([UserStatus.ONLINE], new Set())).to.be.deep.equal({ status: { $in: [UserStatus.ONLINE] } });
	});

	it('should exclude hidden users from a filter that does not include offline', () => {
		expect(effectiveStatusFilter([UserStatus.ONLINE, UserStatus.BUSY], new Set(['alice']))).to.be.deep.equal({
			$and: [{ _id: { $nin: ['alice'] } }, { status: { $in: [UserStatus.ONLINE, UserStatus.BUSY] } }],
		});
	});

	it('should include every hidden user in a filter that includes offline, whatever their stored status', () => {
		expect(effectiveStatusFilter([UserStatus.ONLINE, UserStatus.OFFLINE], new Set(['alice']))).to.be.deep.equal({
			$or: [{ _id: { $nin: ['alice'] }, status: { $in: [UserStatus.ONLINE, UserStatus.OFFLINE] } }, { _id: { $in: ['alice'] } }],
		});
	});
});

describe('effectiveStatusExpression', () => {
	it('should resolve hidden users to offline and leave everyone else untouched', () => {
		expect(effectiveStatusExpression(new Set(['alice', 'bob']))).to.be.deep.equal({
			$cond: [{ $in: ['$_id', ['alice', 'bob']] }, UserStatus.OFFLINE, '$status'],
		});
	});
});

describe('excludingOfflineFilter', () => {
	it('should leave hidden users out, whatever their stored status', () => {
		expect(excludingOfflineFilter()).to.be.deep.equal({ status: { $ne: UserStatus.OFFLINE } });
		expect(excludingOfflineFilter(new Set(['alice']))).to.be.deep.equal({
			$and: [{ _id: { $nin: ['alice'] } }, { status: { $ne: UserStatus.OFFLINE } }],
		});
	});
});
