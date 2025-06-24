import { WizardActions, WizardBackButton, WizardNextButton } from '@rocket.chat/ui-client';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useMutation } from '@tanstack/react-query';
import type { MouseEvent } from 'react';
import { useRef } from 'react';

import type { RepliesFormData, RepliesFormSubmitPayload, RepliesFormRef } from '../forms/RepliesForm';
import RepliesForm from '../forms/RepliesForm';
import { FormRefNotSetError } from '../utils/errors';

type RepliesStepProps = {
	defaultValues?: Partial<RepliesFormData>;
	onSubmit(values: RepliesFormSubmitPayload): void;
};

const RepliesStep = ({ defaultValues, onSubmit }: RepliesStepProps) => {
	const formRef = useRef<RepliesFormRef>({
		submit: () => Promise.reject(new FormRefNotSetError()),
	});

	const nextMutation = useMutation({
		mutationKey: ['outbound-message', 'replies', 'submit'],
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
			<RepliesForm ref={formRef} defaultValues={defaultValues} />

			<WizardActions>
				<WizardBackButton />
				<WizardNextButton loading={nextMutation.isPending} onClick={handleNextClick} />
			</WizardActions>
		</div>
	);
};

export default RepliesStep;
