import { Box, Button } from '@rocket.chat/fuselage';
import { WizardActions } from '@rocket.chat/ui-client';
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
		<div>
			<Box maxHeight={500} overflowX='hidden' overflowY='auto'>
				<OutboundMessagePreview {...props} />
			</Box>

			<WizardActions>
				<Box mie='auto' fontScale='c1' color='annotation'>
					{t('Messages_cannot_be_unsent')}
				</Box>

				<Button primary icon='send' loading={sendMutation.isPending} onClick={() => sendMutation.mutate()}>
					{t('Send')}
				</Button>
			</WizardActions>
		</div>
	);
};

export default ReviewStep;
