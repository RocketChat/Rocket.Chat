import { WizardActions, WizardBackButton, WizardNextButton } from '../../../../../Wizard';
import type { MessageFormSubmitPayload } from '../forms/MessageForm';

type MessageStepProps = {
	onSubmit(values: MessageFormSubmitPayload): void;
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
