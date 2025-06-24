import { Box } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useTranslation } from 'react-i18next';

import type { SubmitPayload } from './forms';
import { ReviewStep, MessageStep, RecipientStep, RepliesStep } from './steps';
import { useHasLicenseModule } from '../../../../../hooks/useHasLicenseModule';
import GenericError from '../../../../GenericError';
import Wizard, { useWizard, WizardContent, WizardTabs } from '../../../../Wizard';
import useOutboundProvidersList from '../../hooks/useOutboundProvidersList';
import { useOutboundMessageUpsellModal } from '../../modals';
import OutboubdMessageWizardSkeleton from './components/OutboundMessageWizardSkeleton';

type OutboundMessageWizardProps = {
	defaultValues?: Partial<Pick<SubmitPayload, 'contactId' | 'providerId'>>;
};

const OutboundMessageWizard = ({ defaultValues = {} }: OutboundMessageWizardProps) => {
	const { t } = useTranslation();
	const upsellModal = useOutboundMessageUpsellModal();
	const hasModule = useHasLicenseModule('outbound-message');
	const isLoadingModule = hasModule === 'loading';
	const [, setState] = useState<Partial<SubmitPayload>>(defaultValues);
	const { data: hasProviders, isLoading: isLoadingProviders } = useOutboundProvidersList({ select: (providers) => providers.length > 0 });

	const wizardApi = useWizard({
		steps: [
			{ id: 'recipient', title: t('Recipient') },
			{ id: 'message', title: t('Message') },
			{ id: 'replies', title: t('Replies') },
			{ id: 'preview', title: t('Preview') },
		],
	});

	useEffect(() => {
		if (!isLoadingProviders && !isLoadingModule && !hasModule && !hasProviders) {
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

	if (isLoadingModule || isLoadingProviders) {
		return <OutboubdMessageWizardSkeleton />;
	}

	return (
		<ErrorBoundary fallbackRender={() => <GenericError icon='circle-exclamation' />}>
			<Wizard api={wizardApi}>
				<WizardTabs />

				<Box mbs={16}>
					<WizardContent id='recipient'>
						<RecipientStep onSubmit={handleSubmit} />
					</WizardContent>

					<WizardContent id='message'>
						<MessageStep onSubmit={handleSubmit} />
					</WizardContent>

					<WizardContent id='replies'>
						<RepliesStep onSubmit={handleSubmit} />
					</WizardContent>

					<WizardContent id='preview'>
						<ReviewStep onSubmit={handleSubmit} />
					</WizardContent>
				</Box>
			</Wizard>
		</ErrorBoundary>
	);
};

export default OutboundMessageWizard;
