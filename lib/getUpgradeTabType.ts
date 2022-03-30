export type UpgradeTabVariant = 'goFullyFeatured' | 'goFullyFeaturedRegistered' | 'trialGold' | 'trialEnterprise' | 'upgradeYourPlan';

type UpgradeTabConditions = {
	registered: boolean;
	hasValidLicense: boolean;
	isTrial: boolean;
	hadExpiredTrials: boolean;
	hasGoldLicense: boolean;
};

export const getUpgradeTabType = ({
	registered,
	hasValidLicense,
	isTrial,
	hasGoldLicense,
	hadExpiredTrials,
}: UpgradeTabConditions): UpgradeTabVariant | false => {
	if (!hasValidLicense) {
		if (hadExpiredTrials) {
			return 'upgradeYourPlan';
		}

		if (registered) {
			return 'goFullyFeaturedRegistered';
		}

		return 'goFullyFeatured';
	}

	if (isTrial) {
		if (hasGoldLicense) {
			return 'trialGold';
		}
		return 'trialEnterprise';
	}

	return false;
};
