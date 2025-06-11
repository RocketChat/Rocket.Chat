import { Box } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useTranslation } from 'react-i18next';

import GenericError from '../../../../GenericError';
import Wizard, { useWizard, WizardContent, WizardTabs } from '../../../../Wizard';

type SubmitPayload = {
	contactId: string;
	providerId: string;
};

type OutboundMessageWizardProps = {
	defaultValues?: Partial<Pick<SubmitPayload, 'contactId' | 'providerId'>>;
};

const OutboundMessageWizard = ({ defaultValues = {} }: OutboundMessageWizardProps) => {
	const { t } = useTranslation();
	const [state, setState] = useState<Partial<SubmitPayload>>(defaultValues);

	const wizardApi = useWizard({
		steps: [
			{ id: 'recipient', title: t('Recipient') },
			{ id: 'message', title: t('Message') },
			{ id: 'replies', title: t('Replies') },
			{ id: 'preview', title: t('Preview') },
		],
	});

	const handleSubmit = useEffectEvent((values: SubmitPayload) => {
		setState((state) => ({ ...state, ...values }));
	});

	const handleSend = useEffectEvent(async () => {
		console.log('sending', state);
	});

	return (
		<ErrorBoundary fallbackRender={() => <GenericError icon='circle-exclamation' />}>
			<Wizard api={wizardApi}>
				<WizardTabs />

				<Box mbs={16}>
					<WizardContent id='recipient'>Recipient Content</WizardContent>
					<WizardContent id='message'>Message Content</WizardContent>
					<WizardContent id='replies'>Replies Content</WizardContent>
					<WizardContent id='preview'>Preview Content</WizardContent>
				</Box>
			</Wizard>
		</ErrorBoundary>
	);
};

export default OutboundMessageWizard;
