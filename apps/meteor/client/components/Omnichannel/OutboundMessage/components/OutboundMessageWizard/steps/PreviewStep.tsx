import { Box, Button } from '@rocket.chat/fuselage';
import { useMutation } from '@tanstack/react-query';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';

import { WizardActions } from '../../../../../Wizard';
import OutboundMessagePreview from '../../OutboundMessagePreview';

type PreviewStepProps = ComponentProps<typeof OutboundMessagePreview> & {
	onSend(): Promise<void>;
};

const PreviewStep = ({ onSend, ...props }: PreviewStepProps) => {
	const { t } = useTranslation();

	const sendMutation = useMutation({ mutationFn: onSend });

	return (
		<div>
			<Box maxHeight={500} overflowX='hidden' overflowY='auto'>
				<OutboundMessagePreview {...props} />
			</Box>

			<WizardActions>
				<Button primary icon='send' loading={sendMutation.isPending} onClick={() => sendMutation.mutate()}>
					{t('Send')}
				</Button>
			</WizardActions>
		</div>
	);
};

export default PreviewStep;
