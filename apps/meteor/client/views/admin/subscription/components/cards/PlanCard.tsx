import type { ILicenseV3 } from '@rocket.chat/core-typings';

import PlanCardPremium from './PlanCard/PlanCardPremium';
import PlanCardTrial from './PlanCard/PlanCardTrial';

type LicenseLimits = {
	activeUsers: { max: number; value?: number };
};

type PlanCardProps = {
	licenseInformation: ILicenseV3['information'];
	licenseLimits: LicenseLimits;
};

const PlanCard = ({ licenseInformation, licenseLimits }: PlanCardProps) => {
	const isTrial = licenseInformation.trial;

	return isTrial ? (
		<PlanCardTrial licenseInformation={licenseInformation} />
	) : (
		<PlanCardPremium licenseInformation={licenseInformation} licenseLimits={licenseLimits} />
	);
};

export default PlanCard;
