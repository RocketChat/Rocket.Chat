import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import type { ComponentProps, MouseEvent } from 'react';
import { useRef } from 'react';

import { WizardActions, WizardBackButton, WizardNextButton } from '../../../../../Wizard';
import type { MessageFormRef, MessageFormSubmitPayload } from '../forms/MessageForm';
import MessageForm from '../forms/MessageForm';

type MessageStepProps = Omit<ComponentProps<typeof MessageForm>, 'onSubmit'> & {
	onSubmit(values: MessageFormSubmitPayload): void;
};

const MessageStep = ({ contact, templates, defaultValues, onSubmit }: MessageStepProps) => {
	const formRef = useRef<MessageFormRef>({
		submit: () => Promise.reject('error-form-ref-not-set'),
	});

	const handleNext = useEffectEvent(async (event: MouseEvent<HTMLButtonElement>) => {
		try {
			const values = await formRef.current.submit();
			onSubmit(values);
		} catch {
			// prevent wizard from advancing to next step
			event.preventDefault();
		}
	});

	return (
		<div>
			<MessageForm ref={formRef} contact={contact} templates={templates} defaultValues={defaultValues} />

			<WizardActions>
				<WizardBackButton />
				<WizardNextButton onClick={handleNext} />
			</WizardActions>
		</div>
	);
};

export default MessageStep;
