import { expect } from 'chai';
import { describe, it } from 'mocha';

import { getUpgradeTabType } from './getUpgradeTabType';

describe('getUpgradeTabType()', () => {
	it("should return 'goFullyFeatured'", () => {
		expect(
			getUpgradeTabType({
				registered: false,
				hasValidLicense: false,
				isTrial: false,
				hadExpiredTrials: false,
				hasGoldLicense: false,
			}),
		).to.be.equal('goFullyFeatured');
	});

	it("should return 'goFullyFeaturedRegistered'", () => {
		expect(
			getUpgradeTabType({
				registered: true,
				hasValidLicense: false,
				isTrial: false,
				hadExpiredTrials: false,
				hasGoldLicense: false,
			}),
		).to.be.equal('goFullyFeaturedRegistered');
	});

	it("should return 'upgradeYourPlan'", () => {
		expect(
			getUpgradeTabType({
				registered: true,
				hasValidLicense: false,
				isTrial: false,
				hadExpiredTrials: true,
				hasGoldLicense: false,
			}),
		).to.be.equal('upgradeYourPlan');
	});

	it("should return 'trialEnterprise'", () => {
		expect(
			getUpgradeTabType({
				registered: true,
				hasValidLicense: true,
				isTrial: true,
				hadExpiredTrials: false,
				hasGoldLicense: false,
			}),
		).to.be.equal('trialEnterprise');
	});

	it("should return 'trialGold'", () => {
		expect(
			getUpgradeTabType({
				registered: true,
				hasValidLicense: true,
				isTrial: true,
				hadExpiredTrials: false,
				hasGoldLicense: true,
			}),
		).to.be.equal('trialGold');
	});

	it('should return false', () => {
		expect(
			getUpgradeTabType({
				registered: true,
				hasValidLicense: true,
				isTrial: false,
				hadExpiredTrials: false,
				hasGoldLicense: false,
			}),
		).to.be.equal(false);
	});
});
