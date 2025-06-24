import { useMutation } from '@tanstack/react-query';
import type { MouseEvent } from 'react';
import { useRef } from 'react';

import { WizardActions, WizardNextButton, useWizardContext } from '../../../../../Wizard';
import type { RecipientFormData, RecipientFormRef, RecipientFormSubmitPayload } from '../forms/RecipientForm';
import RecipientForm from '../forms/RecipientForm';

type RecipientStepProps = {
	defaultValues?: Partial<RecipientFormData>;
	onSubmit(values: RecipientFormSubmitPayload): void;
};

const RecipientStep = ({ defaultValues, onSubmit }: RecipientStepProps) => {
	const { resetNextSteps } = useWizardContext();

	const formRef = useRef<RecipientFormRef>({
		submit: () => Promise.reject('error-form-ref-not-set'),
	});

	const nextMutation = useMutation({
		mutationKey: ['outbound-message', 'recipient', 'submit'],
		mutationFn: () => formRef.current.submit(),
		onSuccess: (values) => onSubmit(values),
		onError: (_, event?: MouseEvent<HTMLButtonElement>) => event?.preventDefault(),
	});

	return (
		<div>
			<RecipientForm ref={formRef} defaultValues={defaultValues} onDirty={resetNextSteps} />

			<WizardActions>
				<WizardNextButton loading={nextMutation.isPending} onClick={nextMutation.mutateAsync} />
			</WizardActions>
		</div>
	);
};

export default RecipientStep;
