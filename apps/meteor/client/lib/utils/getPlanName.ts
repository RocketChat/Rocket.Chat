import type { ILicenseV3 } from '@rocket.chat/license';

import { hasLicenseModule } from './hasLicenseModule';

export enum PlanName {
	COMMUNITY = 'Community',
	STARTER = 'Starter',
	PRO = 'Pro',
	PRO_TRIAL = 'Pro_trial',
	ENTERPRISE = 'Enterprise',
	ENTERPRISE_TRIAL = 'Enterprise_trial',
}

export const getPlanName = (isEnterprise: boolean, license: ILicenseV3): PlanName => {
	const hasWhiteLabelModule = hasLicenseModule(license, 'white-label');
	const hasScalabilityModule = hasLicenseModule(license, 'scalability');

	switch (true) {
		case !isEnterprise:
			return PlanName.COMMUNITY;
		case hasScalabilityModule && license.information.trial:
			return PlanName.ENTERPRISE_TRIAL;
		case hasScalabilityModule:
			return PlanName.ENTERPRISE;
		case hasWhiteLabelModule:
			return PlanName.PRO;
		case license.information.trial:
			return PlanName.PRO_TRIAL;
		default:
			return PlanName.STARTER;
	}
};
