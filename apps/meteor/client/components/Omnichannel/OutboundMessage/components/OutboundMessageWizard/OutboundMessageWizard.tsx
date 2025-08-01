import { Box } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { Wizard, useWizard, WizardContent, WizardTabs } from '@rocket.chat/ui-client';
import { useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useTranslation } from 'react-i18next';

import type { SubmitPayload } from './forms';
import { ReviewStep, MessageStep, RecipientStep, RepliesStep } from './steps';
import GenericError from '../../../../GenericError';

type OutboundMessageWizardProps = {
	defaultValues?: Partial<Pick<SubmitPayload, 'contactId' | 'providerId'>>;
};

const OutboundMessageWizard = ({ defaultValues = {} }: OutboundMessageWizardProps) => {
	const { t } = useTranslation();
	const [state, setState] = useState<Partial<SubmitPayload>>(defaultValues);
	const { contact, sender, provider } = state;

	const templates = sender ? provider?.templates[sender] : [];

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

	return (
		<ErrorBoundary fallbackRender={() => <GenericError icon='circle-exclamation' />}>
			<Wizard api={wizardApi}>
				<WizardTabs />

				<Box mbs={16}>
					<WizardContent id='recipient'>
						<RecipientStep onSubmit={handleSubmit} />
					</WizardContent>

					<WizardContent id='message'>
						<MessageStep defaultValues={state} contact={contact} templates={templates} onSubmit={handleSubmit} />
					</WizardContent>

					<WizardContent id='replies'>
						<RepliesStep onSubmit={handleSubmit} />
					</WizardContent>

					<WizardContent id='preview'>
						<ReviewStep onSend={() => undefined} />
					</WizardContent>
				</Box>
			</Wizard>
		</ErrorBoundary>
	);
};

export default OutboundMessageWizard;
