export type UpgradeTabVariant =
	| 'go-fully-featured'
	| 'go-fully-featured-registered'
	| 'trial-gold'
	| 'trial-enterprise'
	| 'upgrade-your-plan';

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
			return 'upgrade-your-plan';
		}

		if (registered) {
			return 'go-fully-featured-registered';
		}

		return 'go-fully-featured';
	}

	if (isTrial) {
		if (hasGoldLicense) {
			return 'trial-gold';
		}
		return 'trial-enterprise';
	}

	return false;
};
