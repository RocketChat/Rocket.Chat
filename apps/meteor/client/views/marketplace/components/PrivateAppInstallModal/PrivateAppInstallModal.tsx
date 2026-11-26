import {
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
	Stack,
	Text,
} from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import { useExternalLink } from '../../../../hooks/useExternalLink';
import { useCheckoutUrl } from '../../../admin/subscription/hooks/useCheckoutUrl';
import { PRICING_LINK } from '../../../admin/subscription/utils/links';

export type PrivateAppInstallModalProps = {
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
				<Stack gap='x24'>
					<Text is='p'>{t('Private_app_install_modal_content')}</Text>
					<Text is='p'>{t('Upgrade_subscription_to_enable_private_apps')}</Text>
				</Stack>
			</ModalContent>

			<ModalFooter justify='space-between'>
				<ModalFooterAnnotation>
					<a target='_blank' rel='noopener noreferrer' href={PRICING_LINK}>
						{t('Compare_plans')}
					</a>
				</ModalFooterAnnotation>
				<ModalFooterControllers>
					<Button onClick={onProceed}>{t('Upload_anyway')}</Button>
					<Button onClick={goToManageSubscriptionPage} variant='primary'>
						{t('Upgrade')}
					</Button>
				</ModalFooterControllers>
			</ModalFooter>
		</Modal>
	);
};

export default PrivateAppInstallModal;
