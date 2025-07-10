import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useWizardContext, WizardActions, WizardBackButton, WizardNextButton } from '@rocket.chat/ui-client';

import type { RepliesFormData, RepliesFormSubmitPayload } from '../forms/RepliesForm';
import RepliesForm from '../forms/RepliesForm';

type RepliesStepProps = {
	defaultValues?: Partial<RepliesFormData>;
	onSubmit(values: RepliesFormSubmitPayload): void;
};

const RepliesStep = ({ defaultValues, onSubmit }: RepliesStepProps) => {
	const { next } = useWizardContext();

	const handleSubmit = useEffectEvent(async (values: RepliesFormSubmitPayload) => {
		onSubmit(values);
		next();
	});

	return (
		<div>
			<RepliesForm
				defaultValues={defaultValues}
				onSubmit={handleSubmit}
				renderActions={({ isSubmitting }) => (
					<WizardActions>
						<WizardBackButton />
						<WizardNextButton manual type='submit' loading={isSubmitting} />
					</WizardActions>
				)}
			/>
		</div>
	);
};

export default RepliesStep;
