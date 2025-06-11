import { Button } from '@rocket.chat/fuselage';
import { WizardActions } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

type ReviewStepProps = {
	onSend(): void;
};

const ReviewStep = ({ onSend }: ReviewStepProps) => {
	const { t } = useTranslation();
	return (
		<div>
			Review Content
			<WizardActions>
				<Button primary icon='send' onClick={onSend}>
					{t('Send')}
				</Button>
			</WizardActions>
		</div>
	);
};

export default ReviewStep;
