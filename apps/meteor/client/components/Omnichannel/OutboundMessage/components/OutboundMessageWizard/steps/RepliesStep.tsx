import { WizardActions, WizardBackButton, WizardNextButton } from '../../../../../Wizard';
import type { RepliesFormSubmitPayload } from '../forms/RepliesForm';

type RepliesStepProps = {
	onSubmit(values: RepliesFormSubmitPayload): void;
};

const RepliesStep = (_: RepliesStepProps) => {
	return (
		<div>
			Replies Content
			<WizardActions>
				<WizardBackButton />
				<WizardNextButton />
			</WizardActions>
		</div>
	);
};

export default RepliesStep;
