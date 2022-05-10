import React, { ReactElement } from 'react';

import { useSetupWizardContext } from './contexts/SetupWizardContext';
import AdminInfoStep from './steps/AdminInfoStep';
import CloudAccountConfirmation from './steps/CloudAccountConfirmation';
import OrganizationInfoStep from './steps/OrganizationInfoStep';
import RegisterServerStep from './steps/RegisterServerStep';

const SetupWizardPage = (): ReactElement => {
	const { currentStep } = useSetupWizardContext();

	switch (currentStep) {
		case 1:
			return <AdminInfoStep />;
		case 2:
			return <OrganizationInfoStep />;
		case 3:
			return <RegisterServerStep />;
		case 4:
			return <CloudAccountConfirmation />;

		default:
			throw new Error('Wrong wizard step');
	}
};

export default SetupWizardPage;
