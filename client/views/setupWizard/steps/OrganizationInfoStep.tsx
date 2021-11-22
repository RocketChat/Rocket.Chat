import { OrganizationInfoPage } from '@rocket.chat/onboarding-ui';
import React, { ComponentProps, ReactElement } from 'react';

// import { useSettingsDispatch } from '../../../contexts/SettingsContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useSetupWizardContext } from '../contexts/SetupWizardContext';

const OrganizationInfoStep = (): ReactElement => {
	const t = useTranslation();
	// const dispatchSettings = useSettingsDispatch();

	const {
		setupWizardData: { organizationData },
		setSetupWizardData,
		settings,
		goToPreviousStep,
		goToNextStep,
		currentStep,
	} = useSetupWizardContext();

	const countryOptions = settings
		.find(({ _id }) => _id === 'Country')
		.values.map(({ i18nLabel, key }) => [key, t(i18nLabel)]);

	const organizationTypeOptions = settings
		.find(({ _id }) => _id === 'Organization_Type')
		.values.map(({ i18nLabel, key }) => [key, t(i18nLabel)]);

	const organizationIndustryOptions = settings
		.find(({ _id }) => _id === 'Industry')
		.values.map(({ i18nLabel, key }) => [key, t(i18nLabel)]);

	const organizationSizeOptions = settings
		.find(({ _id }) => _id === 'Size')
		.values.map(({ i18nLabel, key }) => [key, t(i18nLabel)]);

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
