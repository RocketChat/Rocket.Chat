export type UpgradeTabVariant = 'go-fully-featured' | 'go-fully-featured-registered' | 'trial-enterprise' | 'upgrade-your-plan';

type UpgradeLabel = 'Upgrade_tab_upgrade_your_plan' | 'Upgrade_tab_trial_guide' | 'Upgrade_tab_go_fully_featured';

type UpgradeTabConditions = {
	registered: boolean;
	hasValidLicense: boolean;
	isTrial: boolean;
	hadExpiredTrials: boolean;
};

export const getUpgradeTabType = ({
	registered,
	hasValidLicense,
	isTrial,
	hadExpiredTrials,
}: UpgradeTabConditions): UpgradeTabVariant | false => {
	if (!hasValidLicense) {
		if (hadExpiredTrials) {
			return 'upgrade-your-plan';
		}
		if (registered) {
			return 'go-fully-featured-registered';
		}
		return 'go-fully-featured';
	}
	if (isTrial) {
		return 'trial-enterprise';
	}

	return false;
};

export const getUpgradeTabLabel = (type: UpgradeTabVariant | false): UpgradeLabel => {
	switch (type) {
		case 'go-fully-featured':
		case 'go-fully-featured-registered':
			return 'Upgrade_tab_go_fully_featured';
		case 'trial-enterprise':
			return 'Upgrade_tab_trial_guide';
		default:
			return 'Upgrade_tab_upgrade_your_plan';
	}
};

export const isFullyFeature = (type: UpgradeTabVariant | false) => type === 'go-fully-featured';
