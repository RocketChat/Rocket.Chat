import { useMutation } from '@tanstack/react-query';
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

	const nextMutation = useMutation({
		mutationKey: ['outbound-message', 'message', 'submit'],
		mutationFn: () => formRef.current.submit(),
		onSuccess: (values) => onSubmit(values),
		onError: (_, event?: MouseEvent<HTMLButtonElement>) => event?.preventDefault(),
	});

	return (
		<div>
			<MessageForm ref={formRef} contact={contact} templates={templates} defaultValues={defaultValues} />

			<WizardActions>
				<WizardBackButton />
				<WizardNextButton loading={nextMutation.isPending} onClick={nextMutation.mutateAsync} />
			</WizardActions>
		</div>
	);
};

export default MessageStep;
