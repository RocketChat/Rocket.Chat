import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
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
			<RepliesForm ref={formRef} defaultValues={defaultValues} />

			<WizardActions>
				<WizardBackButton />
				<WizardNextButton onClick={handleNext} />
			</WizardActions>
		</div>
	);
};

export default RepliesStep;
