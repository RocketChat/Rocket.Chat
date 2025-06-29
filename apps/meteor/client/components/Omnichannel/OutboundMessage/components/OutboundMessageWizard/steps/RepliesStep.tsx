import { useMutation } from '@tanstack/react-query';
import type { MouseEvent } from 'react';
import { useRef } from 'react';

import WizardActions from '../../../../../Wizard/WizardActions';
import WizardBackButton from '../../../../../Wizard/WizardBackButton';
import WizardNextButton from '../../../../../Wizard/WizardNextButton';
import type { RepliesFormData, RepliesFormSubmitPayload, RepliesFormRef } from '../forms/RepliesForm';
import RepliesForm from '../forms/RepliesForm';

type RepliesStepProps = {
	defaultValues?: Partial<RepliesFormData>;
	onSubmit(values: RepliesFormSubmitPayload): void;
};

const RepliesStep = ({ defaultValues, onSubmit }: RepliesStepProps) => {
	const formRef = useRef<RepliesFormRef>({
		submit: () => Promise.reject('error-form-ref-not-set'),
	});

	const nextMutation = useMutation({
		mutationKey: ['outbound-message', 'replies', 'submit'],
		mutationFn: () => formRef.current.submit(),
		onSuccess: (values) => onSubmit(values),
		onError: (_, event?: MouseEvent<HTMLButtonElement>) => event?.preventDefault(),
	});

	return (
		<div>
			<RepliesForm ref={formRef} defaultValues={defaultValues} />

			<WizardActions>
				<WizardBackButton />
				<WizardNextButton loading={nextMutation.isPending} onClick={nextMutation.mutateAsync} />
			</WizardActions>
		</div>
	);
};

export default RepliesStep;
