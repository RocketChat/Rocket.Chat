import { Box } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { Wizard, useWizard, WizardContent, WizardTabs } from '@rocket.chat/ui-client';
import { useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useTranslation } from 'react-i18next';

import OutboundMessageWizardErrorState from './components/OutboundMessageWizardErrorState';
import type { SubmitPayload } from './forms';
import { ReviewStep, MessageStep, RecipientStep, RepliesStep } from './steps';
import { useHasLicenseModule } from '../../../../../hooks/useHasLicenseModule';
import GenericError from '../../../../GenericError';
import useOutboundProvidersList from '../../hooks/useOutboundProvidersList';
import { useOutboundMessageUpsellModal } from '../../modals';
import OutboubdMessageWizardSkeleton from './components/OutboundMessageWizardSkeleton';
import { useEndpointMutation } from '../../../../../hooks/useEndpointMutation';
import { formatOutboundMessage } from '../../utils/template';

type OutboundMessageWizardProps = {
	defaultValues?: Partial<Pick<SubmitPayload, 'contactId' | 'providerId' | 'recipient' | 'sender'>>;
};

const OutboundMessageWizard = ({ defaultValues = {} }: OutboundMessageWizardProps) => {
	const { t } = useTranslation();
	const [state, setState] = useState<Partial<SubmitPayload>>(defaultValues);
	const { contact, sender, provider, department, agent, template, templateParameters, recipient } = state;

	const templates = sender ? provider?.templates[sender] : [];
	const upsellModal = useOutboundMessageUpsellModal();
	const hasModule = useHasLicenseModule('outbound-messaging');
	const isLoadingModule = hasModule === 'loading';

	const sendOutboundMessage = useEndpointMutation('POST', '/v1/omnichannel/outbound/providers/:id/message', {
		keys: { id: provider?.providerId || '' },
	});

	const {
		data: hasProviders = false,
		isLoading: isLoadingProviders,
		isError: isErrorProviders,
		refetch: refetchProviders,
	} = useOutboundProvidersList<boolean>({
		select: ({ providers = [] }) => providers.length > 0,
	});

	const wizardApi = useWizard({
		steps: [
			{ id: 'recipient', title: t('Recipient') },
			{ id: 'message', title: t('Message') },
			{ id: 'replies', title: t('Replies') },
			{ id: 'review', title: t('Review') },
		],
	});

	useEffect(() => {
		if (!isLoadingProviders && !isLoadingModule && (!hasModule || !hasProviders)) {
			upsellModal.open();
		}
	}, [hasModule, hasProviders, isLoadingModule, isLoadingProviders, upsellModal]);

	const handleSubmit = useEffectEvent((values: SubmitPayload) => {
		if (!hasModule) {
			upsellModal.open();
			return;
		}

		setState((state) => ({ ...state, ...values }));
	});

	const handleSend = useEffectEvent(async () => {
		if (!provider) {
			throw new Error(t('Provider_not_found'));
		}

		if (!template) {
			throw new Error(t('Template_not_found'));
		}

		if (!templateParameters) {
			throw new Error(t('Template_parameters_not_found'));
		}

		if (!sender) {
			throw new Error(t('Sender_not_found'));
		}

		if (!recipient) {
			throw new Error(t('Recipient_not_found'));
		}

		const payload = formatOutboundMessage({
			type: 'template',
			template,
			sender,
			recipient,
			parameters: templateParameters,
		});

		sendOutboundMessage.mutate(payload);
	});

	const handleDirtyStep = useEffectEvent(() => {
		wizardApi.resetNextSteps();
	});

	if (isLoadingModule || isLoadingProviders) {
		return <OutboubdMessageWizardSkeleton />;
	}

	if (isErrorProviders) {
		return <OutboundMessageWizardErrorState onRetry={refetchProviders} />;
	}

	return (
		<ErrorBoundary fallbackRender={() => <GenericError icon='circle-exclamation' />}>
			<Wizard api={wizardApi}>
				<WizardTabs />

				<Box mbs={16}>
					<WizardContent id='recipient'>
						<RecipientStep defaultValues={state} onDirty={handleDirtyStep} onSubmit={handleSubmit} />
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
