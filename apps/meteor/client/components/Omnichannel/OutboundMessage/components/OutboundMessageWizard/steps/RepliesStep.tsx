import { useEffectEvent } from '@rocket.chat/fuselage-hooks';

import { useWizardContext } from '../../../../../Wizard';
import WizardActions from '../../../../../Wizard/WizardActions';
import WizardBackButton from '../../../../../Wizard/WizardBackButton';
import WizardNextButton from '../../../../../Wizard/WizardNextButton';
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
