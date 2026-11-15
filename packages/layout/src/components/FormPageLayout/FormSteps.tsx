import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

export type FormStepsProps = {
	currentStep: number;
	stepCount: number;
};

const FormSteps = ({ currentStep, stepCount }: FormStepsProps) => {
	const { t } = useTranslation();

	return (
		<Box marginBlockEnd={8} fontScale='c2' color='secondary-info'>
			{t('component.form.steps', { currentStep, stepCount })}
		</Box>
	);
};

export default FormSteps;
