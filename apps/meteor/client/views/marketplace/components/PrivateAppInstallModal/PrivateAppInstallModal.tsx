import {
	Box,
	Button,
	Modal,
	ModalClose,
	ModalContent,
	ModalFooter,
	ModalFooterAnnotation,
	ModalFooterControllers,
	ModalHeader,
	ModalHeaderText,
	ModalTitle,
} from '@rocket.chat/fuselage';
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
			<ModalHeader>
				<ModalHeaderText>
					<ModalTitle>{t('Private_app_install_modal_title')}</ModalTitle>
				</ModalHeaderText>
				<ModalClose aria-label={t('Close')} onClick={onClose} />
			</ModalHeader>

			<ModalContent>
				<Box mbe={28}>{t('Private_app_install_modal_content')}</Box>
				{t('Upgrade_subscription_to_enable_private_apps')}
			</ModalContent>

			<ModalFooter justifyContent='space-between'>
				<ModalFooterAnnotation>
					<a target='_blank' rel='noopener noreferrer' href={PRICING_LINK}>
						{t('Compare_plans')}
					</a>
				</ModalFooterAnnotation>
				<ModalFooterControllers>
					<Button onClick={onProceed}>{t('Upload_anyway')}</Button>
					<Button onClick={goToManageSubscriptionPage} primary>
						{t('Upgrade')}
					</Button>
				</ModalFooterControllers>
			</ModalFooter>
		</Modal>
	);
};

export default PrivateAppInstallModal;
