import { WizardActions, WizardBackButton, WizardNextButton } from '../../../../../Wizard';

type RepliesStepProps = {
	onSubmit(values: Record<string, string>): void;
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
