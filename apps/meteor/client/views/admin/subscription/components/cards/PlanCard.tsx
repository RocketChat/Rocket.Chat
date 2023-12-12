import type { ILicenseV3 } from '@rocket.chat/core-typings';
import type { ReactElement } from 'react';
import React from 'react';

import PlanCardPremium from './PlanCard/PlanCardPremium';
import PlanCardTrial from './PlanCard/PlanCardTrial';

type LicenseLimits = {
	activeUsers: { max: number; value?: number };
};

type PlanCardProps = {
	licenseInformation: ILicenseV3['information'];
	licenseLimits: LicenseLimits;
};

const PlanCard = ({ licenseInformation, licenseLimits }: PlanCardProps): ReactElement => {
	const isTrial = licenseInformation.trial;

	switch (true) {
		case isTrial:
			return <PlanCardTrial licenseInformation={licenseInformation} />;
		default:
			return <PlanCardPremium licenseInformation={licenseInformation} licenseLimits={licenseLimits} />;
	}
};

export default PlanCard;
