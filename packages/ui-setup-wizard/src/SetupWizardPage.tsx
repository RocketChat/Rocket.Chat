import { useSetupWizardContext } from './contexts/SetupWizardContext.js';
import AdminInfoStep from './steps/AdminInfoStep.js';
import CloudAccountConfirmation from './steps/CloudAccountConfirmation.js';
import OrganizationInfoStep from './steps/OrganizationInfoStep.js';
import RegisterServerStep from './steps/RegisterServerStep.js';

const SetupWizardPage = () => {
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
