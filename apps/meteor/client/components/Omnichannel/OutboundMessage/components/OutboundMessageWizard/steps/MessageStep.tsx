import { WizardActions, WizardBackButton, WizardNextButton } from '../../../../../Wizard';

type MessageStepProps = {
	onSubmit(values: Record<string, string>): void;
};

const MessageStep = (_: MessageStepProps) => {
	return (
		<div>
			Message Content
			<WizardActions>
				<WizardBackButton />
				<WizardNextButton />
			</WizardActions>
		</div>
	);
};

export default MessageStep;
