import { OrganizationInfoPage } from '@rocket.chat/onboarding-ui';
import type { ComponentProps } from 'react';
import { I18nextProvider, useTranslation } from 'react-i18next';

import { useSetupWizardContext } from '../contexts/SetupWizardContext';

const OrganizationInfoStep = () => {
	const { t, i18n } = useTranslation();

	const {
		setupWizardData: { organizationData },
		saveOrganizationData,
		setSetupWizardData,
		organizationOptions,
		canGoToPreviousStep,
		goToPreviousStep,
		goToNextStep,
		completeSetupWizard,
		currentStep,
		skipCloudRegistration,
		maxSteps,
	} = useSetupWizardContext();

	const handleSubmit: ComponentProps<typeof OrganizationInfoPage>['onSubmit'] = async (data) => {
		if (skipCloudRegistration) {
			return completeSetupWizard();
		}

		setSetupWizardData((prevState) => ({ ...prevState, organizationData: data }));

		await saveOrganizationData(data);

		goToNextStep();
	};

	return (
		<I18nextProvider i18n={i18n} defaultNS='onboarding'>
			<OrganizationInfoPage
				initialValues={organizationData}
				onSubmit={handleSubmit}
				onBackButtonClick={canGoToPreviousStep ? goToPreviousStep : undefined}
				currentStep={currentStep}
				stepCount={maxSteps}
				organizationIndustryOptions={organizationOptions.industry}
				organizationSizeOptions={organizationOptions.size}
				countryOptions={organizationOptions.country}
				nextStep={skipCloudRegistration ? t('Register') : undefined}
			/>
		</I18nextProvider>
	);
};

export default OrganizationInfoStep;
