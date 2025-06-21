import { Box } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { SubmitPayload } from './forms';
import { RecipientStep, MessageStep, RepliesStep, PreviewStep } from './steps';
import Wizard, { useWizard, WizardContent, WizardTabs } from '../../../../Wizard';

type OutboundMessageWizardProps = {
	defaultValues?: Partial<Pick<SubmitPayload, 'contactId' | 'providerId'>>;
};

export const OutboundMessageWizard = ({ defaultValues = {} }: OutboundMessageWizardProps) => {
	const { t } = useTranslation();
	const [state, setState] = useState<Partial<SubmitPayload>>(defaultValues);
	const { contact, sender, provider, department, agent, template, templateParameters, recipient } = state;

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

	const handleSend = useEffectEvent(async () => {
		console.log('sending', state);
	});

	return (
		<Wizard api={wizardApi}>
			<WizardTabs />

			<Box mbs={16}>
				<WizardContent id='recipient'>
					<RecipientStep defaultValues={state} onSubmit={handleSubmit} />
				</WizardContent>

				<WizardContent id='message'>
					<MessageStep defaultValues={state} contact={contact} templates={templates} onSubmit={handleSubmit} />
				</WizardContent>

				<WizardContent id='replies'>
					<RepliesStep defaultValues={state} onSubmit={handleSubmit} />
				</WizardContent>

				<WizardContent id='preview'>
					<PreviewStep
						sender={sender}
						recipient={recipient}
						contact={contact}
						department={department}
						provider={provider}
						agent={agent}
						template={template}
						templateParameters={templateParameters}
						onSend={handleSend}
					/>
				</WizardContent>
			</Box>
		</Wizard>
	);
};
