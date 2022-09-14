import { expect } from 'chai';
import { describe, it } from 'mocha';

import { getUpgradeTabLabel, getUpgradeTabType, isFullyFeature } from '../../../lib/upgradeTab';

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

describe('getUpgradeTabLabel()', () => {
	it("should return 'Upgrade_tab_go_fully_featured'", () => {
		expect(getUpgradeTabLabel('go-fully-featured')).to.be.equal('Upgrade_tab_go_fully_featured');
		expect(getUpgradeTabLabel('go-fully-featured-registered')).to.be.equal('Upgrade_tab_go_fully_featured');
	});

	it("should return 'Upgrade_tab_trial_guide'", () => {
		expect(getUpgradeTabLabel('trial-gold')).to.be.equal('Upgrade_tab_trial_guide');
		expect(getUpgradeTabLabel('trial-enterprise')).to.be.equal('Upgrade_tab_trial_guide');
	});

	it("should return 'Upgrade_tab_upgrade_your_plan'", () => {
		expect(getUpgradeTabLabel('upgrade-your-plan')).to.be.equal('Upgrade_tab_upgrade_your_plan');
		expect(getUpgradeTabLabel(false)).to.be.equal('Upgrade_tab_upgrade_your_plan');
	});
});

describe('isFullyFeature()', () => {
	it("should return 'true", () => {
		expect(isFullyFeature('go-fully-featured')).to.be.equal(true);
	});

	it("should return 'false", () => {
		expect(isFullyFeature('upgrade-your-plan')).to.be.equal(false);
		expect(isFullyFeature(false)).to.be.equal(false);
	});
});
