import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useWizardContext, WizardActions, WizardNextButton } from '@rocket.chat/ui-client';

import type { RecipientFormData, RecipientFormSubmitPayload } from '../forms/RecipientForm';
import RecipientForm from '../forms/RecipientForm';

type RecipientStepProps = {
	defaultValues?: Partial<RecipientFormData>;
	onDirty?: () => void;
	onSubmit(values: RecipientFormSubmitPayload): void;
};

const RecipientStep = ({ defaultValues, onDirty, onSubmit }: RecipientStepProps) => {
	const { next } = useWizardContext();

	const handleSubmit = useEffectEvent((values: RecipientFormSubmitPayload) => {
		onSubmit(values);
		next();
	});

	return (
		<div>
			<RecipientForm
				defaultValues={defaultValues}
				onDirty={onDirty}
				onSubmit={handleSubmit}
				renderActions={({ isSubmitting }) => (
					<WizardActions>
						<WizardNextButton manual type='submit' loading={isSubmitting} />
					</WizardActions>
				)}
			/>
		</div>
	);
};

export default RecipientStep;
