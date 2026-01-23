import { Box } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useToastBarDispatch } from '@rocket.chat/fuselage-toastbar';
import { Wizard, useWizard, WizardContent, WizardTabs } from '@rocket.chat/ui-client';
import { usePermission } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useLayoutEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useTranslation } from 'react-i18next';

import OutboundMessageWizardErrorState from './components/OutboundMessageWizardErrorState';
import OutboubdMessageWizardSkeleton from './components/OutboundMessageWizardSkeleton';
import type { SubmitPayload } from './forms';
import { ReviewStep, MessageStep, RecipientStep, RepliesStep } from './steps';
import GenericError from '../../../../../../components/GenericError';
import { useEndpointMutation } from '../../../../../../hooks/useEndpointMutation';
import { useHasLicenseModule } from '../../../../../../hooks/useHasLicenseModule';
import { formatPhoneNumber } from '../../../../../../lib/formatPhoneNumber';
import { omnichannelQueryKeys } from '../../../../../../lib/queryKeys';
import { useOmnichannelEnabled } from '../../../../hooks/useOmnichannelEnabled';
import useOutboundProvidersList from '../../hooks/useOutboundProvidersList';
import { useOutboundMessageUpsellModal } from '../../modals';
import { formatOutboundMessagePayload, isMessageStepValid, isRecipientStepValid, isRepliesStepValid } from '../../utils/outbound-message';

type OutboundMessageWizardProps = {
	defaultValues?: Partial<Pick<SubmitPayload, 'contactId' | 'providerId' | 'recipient' | 'sender'>>;
	onSuccess?(): void;
	onError?(): void;
};

const OutboundMessageWizard = ({ defaultValues = {}, onSuccess, onError }: OutboundMessageWizardProps) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const dispatchToastMessage = useToastBarDispatch();
	const [state, setState] = useState<Partial<SubmitPayload>>(defaultValues);
	const { contact, sender, provider, department, agent, template, templateParameters, recipient } = state;

	const templates = sender ? provider?.templates[sender] : [];
	const upsellModal = useOutboundMessageUpsellModal();

	const isOmnichannelEnabled = useOmnichannelEnabled();
	const hasOmnichannelModule = useHasLicenseModule('livechat-enterprise');
	const hasOutboundModule = useHasLicenseModule('outbound-messaging');
	const hasOutboundPermission = usePermission('outbound.send-messages');

	const isLoadingModule = hasOutboundModule.isPending || hasOmnichannelModule.isPending;

	const sendOutboundMessage = useEndpointMutation('POST', '/v1/omnichannel/outbound/providers/:id/message', {
		keys: { id: provider?.providerId || '' },
		onError: () => undefined, // error being handled in handleSend
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

	useEffect(
		() => () => {
			// Clear cached providers and metadata on unmount to avoid stale data
			void queryClient.removeQueries({ queryKey: omnichannelQueryKeys.outboundProviders() });
		},
		[queryClient],
	);

	useLayoutEffect(() => {
		if (isLoadingModule || isLoadingProviders) {
			return;
		}

		if (!hasOmnichannelModule.data || !hasOutboundModule.data || !hasProviders) {
			upsellModal.open();
		}
	}, [hasOmnichannelModule.data, hasOutboundModule.data, hasProviders, isLoadingModule, isLoadingProviders, upsellModal]);

	const handleSubmit = useEffectEvent((values: SubmitPayload) => {
		if (!hasOutboundModule.data) {
			upsellModal.open();
			return;
		}

		setState((state) => ({ ...state, ...values }));
	});

	const handleSend = useEffectEvent(async () => {
		try {
			if (!isRecipientStepValid(state)) {
				throw new Error('error-invalid-recipient-step');
			}

			if (!isMessageStepValid(state)) {
				throw new Error('error-invalid-message-step');
			}

			if (!isRepliesStepValid(state)) {
				throw new Error('error-invalid-replies-step');
			}

			const { template, sender, recipient, templateParameters, departmentId, agentId } = state;

			const payload = formatOutboundMessagePayload({
				type: 'template',
				template,
				sender,
				recipient,
				templateParameters,
				departmentId,
				agentId,
			});

			await sendOutboundMessage.mutateAsync(payload);

			dispatchToastMessage({
				type: 'success',
				message: t('Outbound_message_sent_to__name__', { name: contact?.name || formatPhoneNumber(recipient) }),
			});

			onSuccess?.();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: t('Outbound_message_not_sent') });

			// only console.error when in debug mode
			const urlParams = new URLSearchParams(window.location.search);
			const debug = urlParams.get('debug') === 'true';

			if (debug) {
				console.error(error);
			}

			onError?.();
		}
	});

	const handleDirtyStep = useEffectEvent(() => {
		wizardApi.resetNextSteps();
	});

	if (!isOmnichannelEnabled) {
		return <OutboundMessageWizardErrorState title={t('error-not-authorized')} description={t('Omnichannel_is_not_enabled')} />;
	}

	if (!hasOutboundPermission) {
		return (
			<OutboundMessageWizardErrorState title={t('error-not-authorized')} description={t('You_are_not_authorized_to_access_this_feature')} />
		);
	}

	if (isLoadingModule || isLoadingProviders) {
		return <OutboubdMessageWizardSkeleton />;
	}

	if (isErrorProviders) {
		return <OutboundMessageWizardErrorState onRetry={refetchProviders} />;
	}

	return (
		<ErrorBoundary fallbackRender={() => <GenericError icon='circle-exclamation' />}>
			<Wizard api={wizardApi} display='flex' flexDirection='column' height='100%'>
				<WizardTabs />

				<Box mbs={16} minHeight={0} flexGrow={1}>
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
