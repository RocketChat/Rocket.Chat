import type { ISetting } from '@rocket.chat/core-typings';
import { OrganizationInfoPage } from '@rocket.chat/onboarding-ui';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useRole, useTranslation } from '@rocket.chat/ui-contexts';
import type { ComponentProps, ReactElement } from 'react';
import React from 'react';

import { useSetupWizardContext } from '../contexts/SetupWizardContext';

const getSettingOptions = (
	settings: Array<ISetting> | undefined,
	settingId: ISetting['_id'],
	t: ReturnType<typeof useTranslation>,
): Array<[key: string, text: string]> => {
	if (!settings) {
		return [];
	}

	const setting = settings.find(({ _id }) => _id === settingId);

	if (!setting?.values) {
		return [];
	}

	return setting.values.map(({ i18nLabel, key }) => [String(key), t(i18nLabel as TranslationKey)]);
};

const OrganizationInfoStep = (): ReactElement => {
	const t = useTranslation();
	const hasAdminRole = useRole('admin');

	const {
		setupWizardData: { organizationData },
		setSetupWizardData,
		settings,
		goToPreviousStep,
		goToNextStep,
		completeSetupWizard,
		currentStep,
		registerPreIntent,
		skipCloudRegistration,
		maxSteps,
	} = useSetupWizardContext();

	const countryOptions = getSettingOptions(settings, 'Country', t);
	const organizationIndustryOptions = getSettingOptions(settings, 'Industry', t);
	const organizationSizeOptions = getSettingOptions(settings, 'Size', t);

	const handleSubmit: ComponentProps<typeof OrganizationInfoPage>['onSubmit'] = async (data) => {
		if (skipCloudRegistration) {
			return completeSetupWizard();
		}
		setSetupWizardData((prevState) => ({ ...prevState, organizationData: data }));
		await registerPreIntent();
		goToNextStep();
	};

	return (
		<OrganizationInfoPage
			initialValues={organizationData}
			onSubmit={handleSubmit}
			onBackButtonClick={!hasAdminRole ? goToPreviousStep : undefined}
			currentStep={currentStep}
			stepCount={maxSteps}
			organizationIndustryOptions={organizationIndustryOptions}
			organizationSizeOptions={organizationSizeOptions}
			countryOptions={countryOptions}
			nextStep={skipCloudRegistration ? t('Register') : undefined}
		/>
	);
};

export default OrganizationInfoStep;
