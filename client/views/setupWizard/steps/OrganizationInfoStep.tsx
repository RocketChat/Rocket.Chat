import { OrganizationInfoPage } from '@rocket.chat/onboarding-ui';
import React, { ComponentProps, ReactElement } from 'react';

import { ISetting } from '../../../../definition/ISetting';
import { useTranslation, TranslationKey } from '../../../contexts/TranslationContext';
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

	if (!setting || !setting.values) {
		return [];
	}

	return setting.values.map(({ i18nLabel, key }) => [String(key), t(i18nLabel as TranslationKey)]);
};

const OrganizationInfoStep = (): ReactElement => {
	const t = useTranslation();

	const {
		setupWizardData: { organizationData },
		setSetupWizardData,
		settings,
		goToPreviousStep,
		goToNextStep,
		currentStep,
	} = useSetupWizardContext();

	const countryOptions = getSettingOptions(settings, 'Country', t);
	const organizationTypeOptions = getSettingOptions(settings, 'Organization_Type', t);
	const organizationIndustryOptions = getSettingOptions(settings, 'Industry', t);
	const organizationSizeOptions = getSettingOptions(settings, 'Size', t);

	const handleSubmit: ComponentProps<typeof OrganizationInfoPage>['onSubmit'] = async (data) => {
		setSetupWizardData((prevState) => ({ ...prevState, organizationData: data }));
		goToNextStep();
	};

	return (
		<OrganizationInfoPage
			initialValues={organizationData}
			onSubmit={handleSubmit}
			onBackButtonClick={goToPreviousStep}
			currentStep={currentStep}
			stepCount={4}
			organizationTypeOptions={organizationTypeOptions}
			organizationIndustryOptions={organizationIndustryOptions}
			organizationSizeOptions={organizationSizeOptions}
			countryOptions={countryOptions}
		/>
	);
};

export default OrganizationInfoStep;
