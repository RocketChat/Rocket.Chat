import { Box, Button, Modal } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import { useExternalLink } from '../../../../hooks/useExternalLink';
import { useCheckoutUrl } from '../../../admin/subscription/hooks/useCheckoutUrl';
import { PRICING_LINK } from '../../../admin/subscription/utils/links';

type PrivateAppInstallModalProps = {
	onClose: () => void;
	onProceed: () => void;
};

const PrivateAppInstallModal = ({ onClose, onProceed }: PrivateAppInstallModalProps) => {
	const { t } = useTranslation();

	const openExternalLink = useExternalLink();
	const manageSubscriptionUrl = useCheckoutUrl()({ target: 'private-apps-page', action: 'upgrade' });

	const goToManageSubscriptionPage = (): void => {
		openExternalLink(manageSubscriptionUrl);
		onClose();
	};

	return (
		<Modal>
			<Modal.Header>
				<Modal.HeaderText>
					<Modal.Title>{t('Private_app_install_modal_title')}</Modal.Title>
				</Modal.HeaderText>
				<Modal.Close aria-label={t('Close')} onClick={onClose} />
			</Modal.Header>

			<Modal.Content>
				<Box mbe={28}>{t('Private_app_install_modal_content')}</Box>
				{t('Upgrade_subscription_to_enable_private_apps')}
			</Modal.Content>

			<Modal.Footer justifyContent='space-between'>
				<Modal.FooterAnnotation>
					<a target='_blank' rel='noopener noreferrer' href={PRICING_LINK}>
						{t('Compare_plans')}
					</a>
				</Modal.FooterAnnotation>
				<Modal.FooterControllers>
					<Button onClick={onProceed}>{t('Upload_anyway')}</Button>
					<Button onClick={goToManageSubscriptionPage} primary>
						{t('Upgrade')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default PrivateAppInstallModal;
