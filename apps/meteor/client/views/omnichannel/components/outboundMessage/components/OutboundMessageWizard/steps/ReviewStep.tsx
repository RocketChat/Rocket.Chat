import { Button } from '@rocket.chat/fuselage';
import { WizardActions, WizardBackButton } from '@rocket.chat/ui-client';
import { useMutation } from '@tanstack/react-query';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';

import OutboundMessageStep from '../../../layout/OutboundMessageStep';
import OutboundMessagePreview from '../../OutboundMessagePreview';

export type ReviewStepProps = ComponentProps<typeof OutboundMessagePreview> & {
	onSend(): Promise<void>;
};

const ReviewStep = ({ onSend, ...props }: ReviewStepProps) => {
	const { t } = useTranslation();

	const sendMutation = useMutation({ mutationFn: onSend });

	return (
		<OutboundMessageStep
			actions={
				<WizardActions annotation={t('Messages_cannot_be_unsent')}>
					<WizardBackButton />

					<Button variant='primary' icon='send' loading={sendMutation.isPending} onClick={() => sendMutation.mutate()}>
						{t('Send')}
					</Button>
				</WizardActions>
			}
		>
			<OutboundMessagePreview {...props} />
		</OutboundMessageStep>
	);
};

export default ReviewStep;
