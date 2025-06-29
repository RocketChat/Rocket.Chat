import { useMutation } from '@tanstack/react-query';
import type { MouseEvent } from 'react';
import { useRef } from 'react';

import { useHasLicenseModule } from '../../../../../../hooks/useHasLicenseModule';
import { WizardActions, WizardNextButton, useWizardContext } from '../../../../../Wizard';
import { useOutboundMessageUpsellModal } from '../../../modals';
import type { RecipientFormData, RecipientFormRef, RecipientFormSubmitPayload } from '../forms/RecipientForm';
import RecipientForm from '../forms/RecipientForm';
import { FeatureUpsellError } from '../utils/errors';

type RecipientStepProps = {
	defaultValues?: Partial<RecipientFormData>;
	onSubmit(values: RecipientFormSubmitPayload): void;
};

const RecipientStep = ({ defaultValues, onSubmit }: RecipientStepProps) => {
	const hasModule = useHasLicenseModule('outbound-message') === true;
	const upsellModal = useOutboundMessageUpsellModal();
	const { resetNextSteps } = useWizardContext();

	const formRef = useRef<RecipientFormRef>({
		submit: () => Promise.reject('error-form-ref-not-set'),
	});

	const nextMutation = useMutation({
		mutationKey: ['outbound-message', 'recipient', 'submit', upsellModal],
		mutationFn: () => {
			if (!hasModule) {
				throw new FeatureUpsellError('error-outbound-message-upsell');
			}

			return formRef.current.submit();
		},
		onSuccess: (values) => onSubmit(values),
		onError: (error, event?: MouseEvent<HTMLButtonElement>) => {
			if (error instanceof FeatureUpsellError) {
				upsellModal.open();
			}

			event?.preventDefault();
		},
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
