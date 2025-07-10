import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import type { ComponentProps } from 'react';

import { useWizardContext, WizardActions, WizardBackButton, WizardNextButton } from '../../../../../Wizard';
import type { MessageFormSubmitPayload } from '../forms/MessageForm';
import MessageForm from '../forms/MessageForm';

type MessageStepProps = Omit<ComponentProps<typeof MessageForm>, 'onSubmit'> & {
	onSubmit(values: MessageFormSubmitPayload): void;
};

const MessageStep = ({ contact, templates, defaultValues, onSubmit }: MessageStepProps) => {
	const { next } = useWizardContext();

	const handleSubmit = useEffectEvent(async (values: MessageFormSubmitPayload) => {
		onSubmit(values);
		next();
	});

	return (
		<div>
			<MessageForm
				contact={contact}
				templates={templates}
				defaultValues={defaultValues}
				onSubmit={handleSubmit}
				renderActions={({ isSubmitting }) => (
					<WizardActions>
						<WizardBackButton />
						<WizardNextButton manual type='submit' loading={isSubmitting} />
					</WizardActions>
				)}
			/>
		</div>
	);
};

export default MessageStep;
