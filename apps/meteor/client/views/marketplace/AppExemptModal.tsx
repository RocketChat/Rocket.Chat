import { Box, Modal } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import GenericModal from '../../components/GenericModal';
import { useExternalLink } from '../../hooks/useExternalLink';
import { useCheckoutUrl } from '../admin/subscription/hooks/useCheckoutUrl';
import { PRICING_LINK } from '../admin/subscription/utils/links';

type AppExemptModalProps = {
	onCancel: () => void;
	appName: string;
};

const AppExemptModal = ({ onCancel, appName }: AppExemptModalProps) => {
	const { t } = useTranslation();

	const openExternalLink = useExternalLink();
	const manageSubscriptionUrl = useCheckoutUrl()({ target: 'private-apps-page', action: 'upgrade' });

	const goToManageSubscriptionPage = (): void => {
		openExternalLink(manageSubscriptionUrl);
		onCancel();
	};

	return (
		<GenericModal
			title={t('Apps_Cannot_Be_Updated')}
			onClose={onCancel}
			dontAskAgain={
				<Modal.FooterAnnotation>
					<a target='_blank' rel='noopener noreferrer' href={PRICING_LINK}>
						{t('Compare_plans')}
					</a>
				</Modal.FooterAnnotation>
			}
			variant='warning'
			cancelText={t('Cancel')}
			confirmText={t('Upgrade')}
			onCancel={onCancel}
			onConfirm={goToManageSubscriptionPage}
		>
			<Box mbe={28}>{t('Apps_Private_App_Is_Exempt', { appName })}</Box>
			{t('Upgrade_subscription_to_enable_private_apps')}
		</GenericModal>
	);
};

export default AppExemptModal;
