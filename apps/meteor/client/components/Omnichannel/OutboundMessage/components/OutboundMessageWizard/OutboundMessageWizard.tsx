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
	defaultValues?: Partial<SubmitPayload>;
};

const OutboundMessageWizard = ({ defaultValues = {} }: OutboundMessageWizardProps) => {
	const { t } = useTranslation();
	const [state, setState] = useState<Partial<SubmitPayload>>(defaultValues);
	const { contact, sender, provider, department, agent, template, templateParameters, recipient } = state;

	const templates = sender ? provider?.templates[sender] : [];

	const wizardApi = useWizard({
		steps: [
			{ id: 'recipient', title: t('Recipient') },
			{ id: 'message', title: t('Message') },
			{ id: 'replies', title: t('Replies') },
			{ id: 'review', title: t('Review') },
		],
	});

	const handleSubmit = useEffectEvent((values: SubmitPayload) => {
		setState((state) => ({ ...state, ...values }));
	});

	const handleSend = useEffectEvent(async () => {
		console.log('Message sent with values:', state);
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
						<RepliesStep defaultValues={state} onSubmit={handleSubmit} />
					</WizardContent>

					<WizardContent id='review'>
						<ReviewStep
							sender={sender}
							recipient={recipient}
							contactName={contact?.name}
							departmentName={department?.name}
							providerType={provider?.providerType}
							providerName={provider?.providerName}
							agentName={agent?.name}
							agentUsername={agent?.username}
							template={template}
							templateParameters={templateParameters}
							onSend={handleSend}
						/>
					</WizardContent>
				</Box>
			</Wizard>
		</ErrorBoundary>
	);
};

export default OutboundMessageWizard;
