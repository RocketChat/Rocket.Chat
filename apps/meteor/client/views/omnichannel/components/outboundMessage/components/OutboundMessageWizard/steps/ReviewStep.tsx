import { Box, Button, Scrollable } from '@rocket.chat/fuselage';
import { WizardActions, WizardBackButton } from '@rocket.chat/ui-client';
import { useMutation } from '@tanstack/react-query';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';

import OutboundMessagePreview from '../../OutboundMessagePreview';

type ReviewStepProps = ComponentProps<typeof OutboundMessagePreview> & {
	onSend(): Promise<void>;
};

const ReviewStep = ({ onSend, ...props }: ReviewStepProps) => {
	const { t } = useTranslation();

	const sendMutation = useMutation({ mutationFn: onSend });

	return (
		<Box display='flex' flexDirection='column' height='100%'>
			<Scrollable vertical>
				<OutboundMessagePreview {...props} maxHeight={500} />
			</Scrollable>

			<WizardActions annotation={t('Messages_cannot_be_unsent')}>
				<WizardBackButton />

				<Button primary icon='send' loading={sendMutation.isPending} onClick={() => sendMutation.mutate()}>
					{t('Send')}
				</Button>
			</WizardActions>
		</Box>
	);
};

export default ReviewStep;
