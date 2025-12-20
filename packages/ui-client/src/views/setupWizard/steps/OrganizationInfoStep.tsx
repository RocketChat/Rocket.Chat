import type { ISetting } from '@rocket.chat/core-typings';
import { OrganizationInfoPage } from '@rocket.chat/onboarding-ui';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useRole } from '@rocket.chat/ui-contexts';
import type { TFunction } from 'i18next';
import type { ComponentProps, ReactElement } from 'react';
import { I18nextProvider, useTranslation } from 'react-i18next';

import { useSetupWizardContext } from '../contexts/SetupWizardContext';

const getSettingOptions = (
	settings: Array<ISetting> | undefined,
	settingId: ISetting['_id'],
	t: TFunction,
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
	const { t, i18n } = useTranslation();
	const hasAdminRole = useRole('admin');

	const {
		setupWizardData: { organizationData },
		saveOrganizationData,
		setSetupWizardData,
		settings,
		goToPreviousStep,
		goToNextStep,
		completeSetupWizard,
		currentStep,
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

		await saveOrganizationData(data);

		goToNextStep();
	};

	return (
		<I18nextProvider i18n={i18n} defaultNS='onboarding'>
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
		</I18nextProvider>
	);
};

export default OrganizationInfoStep;
