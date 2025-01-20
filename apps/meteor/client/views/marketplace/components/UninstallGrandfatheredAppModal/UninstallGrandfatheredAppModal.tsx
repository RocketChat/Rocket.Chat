import { Button, Modal } from '@rocket.chat/fuselage';
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
			<Modal.Header>
				<Modal.HeaderText>
					<Modal.Title>{t('Uninstall_grandfathered_app', { appName })}</Modal.Title>
				</Modal.HeaderText>
				<Modal.Close onClick={handleClose} />
			</Modal.Header>
			<Modal.Content>
				<MarkdownText content={modalContent} />
			</Modal.Content>
			<Modal.Footer justifyContent='space-between'>
				<Modal.FooterAnnotation>
					{/* TODO: Move the link to a go link when available */}
					<a target='_blank' rel='noopener noreferrer' href='https://docs.rocket.chat/docs/rocketchat-marketplace'>
						{t('Learn_more')}
					</a>
				</Modal.FooterAnnotation>
				<Modal.FooterControllers>
					<Button onClick={handleClose}>{t('Cancel')}</Button>
					<Button danger onClick={handleUninstall}>
						{t('Uninstall')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default UninstallGrandfatheredAppModal;
