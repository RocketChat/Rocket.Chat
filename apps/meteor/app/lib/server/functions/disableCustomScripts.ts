import { License } from '@rocket.chat/license';

export const disableCustomScripts = () => {
	const license = License.getLicense();

	if (!license) {
		return false;
	}

	const isCustomScriptDisabled = process.env.DISABLE_CUSTOM_SCRIPTS === 'true';
	const isTrialLicense = license?.information.trial;

	return isCustomScriptDisabled && isTrialLicense;
};
