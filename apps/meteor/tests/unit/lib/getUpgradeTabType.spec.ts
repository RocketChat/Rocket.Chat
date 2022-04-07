import { expect } from 'chai';
import { describe, it } from 'mocha';

import { getUpgradeTabType } from '../../../lib/getUpgradeTabType';

describe('getUpgradeTabType()', () => {
	it("should return 'go-fully-featured'", () => {
		expect(
			getUpgradeTabType({
				registered: false,
				hasValidLicense: false,
				isTrial: false,
				hadExpiredTrials: false,
				hasGoldLicense: false,
			}),
		).to.be.equal('go-fully-featured');
	});

	it("should return 'go-fully-featured-registered'", () => {
		expect(
			getUpgradeTabType({
				registered: true,
				hasValidLicense: false,
				isTrial: false,
				hadExpiredTrials: false,
				hasGoldLicense: false,
			}),
		).to.be.equal('go-fully-featured-registered');
	});

	it("should return 'upgrade-your-plan'", () => {
		expect(
			getUpgradeTabType({
				registered: true,
				hasValidLicense: false,
				isTrial: false,
				hadExpiredTrials: true,
				hasGoldLicense: false,
			}),
		).to.be.equal('upgrade-your-plan');
	});

	it("should return 'trial-enterprise'", () => {
		expect(
			getUpgradeTabType({
				registered: true,
				hasValidLicense: true,
				isTrial: true,
				hadExpiredTrials: false,
				hasGoldLicense: false,
			}),
		).to.be.equal('trial-enterprise');
	});

	it("should return 'trial-gold'", () => {
		expect(
			getUpgradeTabType({
				registered: true,
				hasValidLicense: true,
				isTrial: true,
				hadExpiredTrials: false,
				hasGoldLicense: true,
			}),
		).to.be.equal('trial-gold');
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
