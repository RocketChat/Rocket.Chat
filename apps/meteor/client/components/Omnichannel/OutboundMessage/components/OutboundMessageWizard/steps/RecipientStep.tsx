import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { WizardActions, WizardNextButton } from '@rocket.chat/ui-client';
import { useMutation } from '@tanstack/react-query';
import type { MouseEvent } from 'react';
import { useRef } from 'react';

import type { RecipientFormData, RecipientFormRef, RecipientFormSubmitPayload } from '../forms/RecipientForm';
import RecipientForm from '../forms/RecipientForm';
import { FormRefNotSetError } from '../utils/errors';

type RecipientStepProps = {
	defaultValues?: Partial<RecipientFormData>;
	onDirty?: () => void;
	onSubmit(values: RecipientFormSubmitPayload): void;
};

const RecipientStep = ({ defaultValues, onDirty, onSubmit }: RecipientStepProps) => {
	const formRef = useRef<RecipientFormRef>({
		submit: () => Promise.reject(new FormRefNotSetError()),
	});

	const nextMutation = useMutation({
		mutationKey: ['outbound-message', 'recipient', 'submit'],
		mutationFn: () => formRef.current.submit(),
		throwOnError: false,
	});

	const handleNextClick = useEffectEvent(async (event: MouseEvent<HTMLButtonElement>) => {
		try {
			const values = await nextMutation.mutateAsync();
			onSubmit(values);
		} catch (error) {
			event.preventDefault();
		}
	});

	return (
		<div>
			<RecipientForm ref={formRef} defaultValues={defaultValues} onDirty={onDirty} />

			<WizardActions>
				<WizardNextButton loading={nextMutation.isPending} onClick={handleNextClick} />
			</WizardActions>
		</div>
	);
};

export default RecipientStep;
