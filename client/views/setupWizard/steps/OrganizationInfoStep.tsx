import { OrganizationInfoPage } from '@rocket.chat/onboarding-ui';
import React, { ReactElement } from 'react';

// import { useSettingsDispatch } from '../../../contexts/SettingsContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useSetupWizardContext } from '../contexts/SetupWizardContext';

type OrganizationInfoStepProps = {
	step: number;
};

const OrganizationInfoStep = ({ step }: OrganizationInfoStepProps): ReactElement => {
	const t = useTranslation();
	// const dispatchSettings = useSettingsDispatch();

	const {
		setupWizardData: { organizationData },
		setSetupWizardData,
		settings,
		goToPreviousStep,
		goToNextStep,
	} = useSetupWizardContext();

	const filteredSettings = settings.filter(({ _id }) =>
		['Organization_Name', 'Organization_Type', 'Industry', 'Country', 'Size'].includes(_id),
	);

	const countryOptions = filteredSettings
		.filter(({ _id }) => _id === 'Country')[0]
		.values.map(({ i18nLabel, key }) => [key, t(i18nLabel)]);

	const organizationTypeOptions = filteredSettings
		.filter(({ _id }) => _id === 'Organization_Type')[0]
		.values.map(({ i18nLabel, key }) => [key, t(i18nLabel)]);

	const organizationIndustryOptions = filteredSettings
		.filter(({ _id }) => _id === 'Industry')[0]
		.values.map(({ i18nLabel, key }) => [key, t(i18nLabel)]);

	const organizationSizeOptions = filteredSettings
		.filter(({ _id }) => _id === 'Size')[0]
		.values.map(({ i18nLabel, key }) => [key, t(i18nLabel)]);

	// useEffect(() => {
	// 	resetFields(
	// 		settings
	// 			.filter(({ wizard }) => wizard.step === step)
	// 			.filter(({ type }) => ['string', 'select', 'language', 'boolean'].includes(type))
	// 			.sort(({ wizard: { order: a } }, { wizard: { order: b } }) => a - b)
	// 			.map(({ value, ...field }) => ({ ...field, value: value != null ? value : '' })),
	// 	);
	// }, [settings, currentStep, step, resetFields]);

	const handleBackClick = (): void => {
		goToPreviousStep();
	};

	const handleSubmit = async (data): Promise<void> => {
		setSetupWizardData((prevState) => ({ ...prevState, organizationData: data }));
		goToNextStep();

		// try {
		// 	await dispatchSettings(fields.map(({ _id, value }) => ({ _id, value })));
		// 	goToNextStep();
		// } catch (error) {
		// 	dispatchToastMessage({ type: 'error', message: error });
		// } finally {
		// 	setCommiting(false);
		// }
	};

	return (
		<OrganizationInfoPage
			initialValues={organizationData}
			onSubmit={handleSubmit}
			onBackButtonClick={handleBackClick}
			currentStep={step}
			stepCount={4}
			organizationTypeOptions={organizationTypeOptions}
			organizationIndustryOptions={organizationIndustryOptions}
			organizationSizeOptions={organizationSizeOptions}
			countryOptions={countryOptions}
		/>
	);
};

export default OrganizationInfoStep;
