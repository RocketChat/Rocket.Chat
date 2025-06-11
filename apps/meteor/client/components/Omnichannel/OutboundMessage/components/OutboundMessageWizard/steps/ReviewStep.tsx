import { Button } from '@rocket.chat/fuselage';
import { WizardActions } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

type ReviewStepProps = {
	onSubmit(values: Record<string, string>): void;
};

const ReviewStep = (_: ReviewStepProps) => {
	const { t } = useTranslation();
	return (
		<div>
			Review Content
			<WizardActions>
				<Button primary icon='send'>
					{t('Send')}
				</Button>
			</WizardActions>
		</div>
	);
};

export default ReviewStep;
