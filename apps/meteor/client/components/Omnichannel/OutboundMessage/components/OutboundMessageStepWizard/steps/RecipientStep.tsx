import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
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
			<RecipientForm ref={formRef} defaultValues={defaultValues} onDirty={resetNextSteps} />

			<WizardActions>
				<WizardNextButton onClick={handleNext} />
			</WizardActions>
		</div>
	);
};

export default RecipientStep;
