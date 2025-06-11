import { WizardActions, WizardNextButton } from '@rocket.chat/ui-client';

import type { RecipientFormSubmitPayload } from '../forms/RecipientForm';

type RecipientStepProps = {
	onSubmit(values: RecipientFormSubmitPayload): void;
};

const RecipientStep = (_: RecipientStepProps) => {
	return (
		<div>
			Recipient Content
			<WizardActions>
				<WizardNextButton />
			</WizardActions>
		</div>
	);
};

export default RecipientStep;
