import { Button } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import { WizardActions } from '../../../../../Wizard';

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
