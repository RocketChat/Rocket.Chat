import { WizardActions, WizardNextButton } from '@rocket.chat/ui-client';

type RecipientStepProps = {
	onSubmit(values: Record<string, string>): void;
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
