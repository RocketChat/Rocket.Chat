export type UpgradeTabVariants = 'goFullyFeatured' | 'trialGuide' | 'upgradeYourPlan';

type UpgradeTabConditions = { registered: boolean; isEnterprise: boolean; isTrial: boolean; hadExpiredTrials: boolean };

export const getUpgradeTabType = ({
	registered,
	isEnterprise,
	isTrial,
	hadExpiredTrials,
}: UpgradeTabConditions): UpgradeTabVariants | false => {
	if (!registered || (registered && !isEnterprise)) {
		return 'goFullyFeatured';
	}

	if (isTrial) {
		return 'trialGuide';
	}

	if (hadExpiredTrials && !isEnterprise) {
		return 'upgradeYourPlan';
	}

	return false;
};
