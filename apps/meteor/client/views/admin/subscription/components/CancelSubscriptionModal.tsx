import { ExternalLink } from '@rocket.chat/ui-client';
import { Trans, useTranslation } from 'react-i18next';

import GenericModal from '../../../../components/GenericModal';
import { DOWNGRADE_LINK } from '../utils/links';

type CancelSubscriptionModalProps = {
	planName: string;
	onConfirm(): void;
	onCancel(): void;
};

export const CancelSubscriptionModal = ({ planName, onCancel, onConfirm }: CancelSubscriptionModalProps) => {
	const { t } = useTranslation();

	return (
		<GenericModal
			variant='danger'
			title={t('Cancel__planName__subscription', { planName })}
			icon={null}
			confirmText={t('Cancel_subscription')}
			cancelText={t('Dont_cancel')}
			onConfirm={onConfirm}
			onCancel={onCancel}
		>
			<Trans i18nKey='Cancel_subscription_message' t={t}>
				<strong>This workspace will downgrade to Community and lose free access to premium capabilities.</strong>
				<br />
				<br />
				While you can keep using Rocket.Chat, your team will lose access to unlimited mobile push notifications, read receipts, marketplace
				apps and <ExternalLink to={DOWNGRADE_LINK}>other capabilities</ExternalLink>.
			</Trans>
		</GenericModal>
	);
};
