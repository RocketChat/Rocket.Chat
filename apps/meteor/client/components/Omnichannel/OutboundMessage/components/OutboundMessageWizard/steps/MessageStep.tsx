import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { WizardActions, WizardBackButton, WizardNextButton } from '@rocket.chat/ui-client';
import { useMutation } from '@tanstack/react-query';
import type { ComponentProps, MouseEvent } from 'react';
import { useRef } from 'react';

import type { MessageFormRef, MessageFormSubmitPayload } from '../forms/MessageForm';
import MessageForm from '../forms/MessageForm';
import { FormRefNotSetError } from '../utils/errors';

type MessageStepProps = Omit<ComponentProps<typeof MessageForm>, 'onSubmit'> & {
	onSubmit(values: MessageFormSubmitPayload): void;
};

const MessageStep = ({ contact, templates, defaultValues, onSubmit }: MessageStepProps) => {
	const formRef = useRef<MessageFormRef>({
		submit: () => Promise.reject(new FormRefNotSetError()),
	});

	const nextMutation = useMutation({
		mutationKey: ['outbound-message', 'message', 'submit'],
		mutationFn: () => formRef.current.submit(),
		throwOnError: false,
	});

	const handleNextClick = useEffectEvent(async (event: MouseEvent<HTMLButtonElement>) => {
		try {
			const values = await nextMutation.mutateAsync();
			onSubmit(values);
		} catch {
			event.preventDefault();
		}
	});

	return (
		<div>
			<MessageForm ref={formRef} contact={contact} templates={templates} defaultValues={defaultValues} />

			<WizardActions>
				<WizardBackButton />
				<WizardNextButton loading={nextMutation.isPending} onClick={handleNextClick} />
			</WizardActions>
		</div>
	);
};

export default MessageStep;
