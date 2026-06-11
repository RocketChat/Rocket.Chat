import type { ILicenseV3 } from '@rocket.chat/core-typings';

import PlanCardCommunity from './PlanCard/PlanCardCommunity';
import PlanCardPremium from './PlanCard/PlanCardPremium';
import PlanCardTrial from './PlanCard/PlanCardTrial';

type LicenseLimits = {
	activeUsers: { max: number; value?: number };
};

type PlanCardProps = {
	license?: ILicenseV3;
	licenseLimits: LicenseLimits;
};

const PlanCard = ({ license, licenseLimits }: PlanCardProps) => {
	const isTrial = license?.information.trial;

	if (!license) {
		return <PlanCardCommunity />;
	}

	return isTrial ? (
		<PlanCardTrial licenseInformation={license.information} />
	) : (
		<PlanCardPremium licenseInformation={license.information} licenseLimits={licenseLimits} />
	);
};

export default PlanCard;
