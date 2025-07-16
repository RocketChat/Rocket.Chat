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
} from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import MarkdownText from '../../../../components/MarkdownText';
import type { MarketplaceRouteContext } from '../../hooks/useAppsCountQuery';
import { usePrivateAppsEnabled } from '../../hooks/usePrivateAppsEnabled';

type UninstallGrandfatheredAppModalProps = {
	context: MarketplaceRouteContext;
	limit: number;
	appName: string;
	handleUninstall: () => void;
	handleClose: () => void;
};

const UninstallGrandfatheredAppModal = ({ context, limit, appName, handleUninstall, handleClose }: UninstallGrandfatheredAppModalProps) => {
	const { t } = useTranslation();
	const privateAppsEnabled = usePrivateAppsEnabled();

	const modalContent =
		context === 'private' && !privateAppsEnabled
			? t('App_will_lose_grandfathered_status_private')
			: t('App_will_lose_grandfathered_status', { limit });

	return (
		<Modal>
			<ModalHeader>
				<ModalHeaderText>
					<ModalTitle>{t('Uninstall_grandfathered_app', { appName })}</ModalTitle>
				</ModalHeaderText>
				<ModalClose onClick={handleClose} />
			</ModalHeader>
			<ModalContent>
				<MarkdownText content={modalContent} />
			</ModalContent>
			<ModalFooter justifyContent='space-between'>
				<ModalFooterAnnotation>
					{/* TODO: Move the link to a go link when available */}
					<a target='_blank' rel='noopener noreferrer' href='https://docs.rocket.chat/docs/rocketchat-marketplace'>
						{t('Learn_more')}
					</a>
				</ModalFooterAnnotation>
				<ModalFooterControllers>
					<Button onClick={handleClose}>{t('Cancel')}</Button>
					<Button danger onClick={handleUninstall}>
						{t('Uninstall')}
					</Button>
				</ModalFooterControllers>
			</ModalFooter>
		</Modal>
	);
};

export default UninstallGrandfatheredAppModal;
