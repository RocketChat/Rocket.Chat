import { Button, Modal } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import MarkdownText from '../../../../components/MarkdownText';
import type { MarketplaceRouteContext } from '../../hooks/useAppsCountQuery';

type AppsInstallationModalProps = {
	context: MarketplaceRouteContext;
	enabled: number;
	limit: number;
	appName: string;
	handleClose: () => void;
	handleConfirm: () => void;
	handleEnableUnlimitedApps: () => void;
};

const AppInstallationModal = ({
	context,
	enabled,
	limit,
	appName,
	handleClose,
	handleConfirm,
	handleEnableUnlimitedApps,
}: AppsInstallationModalProps) => {
	const t = useTranslation();

	const getTitle = () => {
		if (enabled === limit) {
			return context === 'private' ? t('Private_apps_limit_reached') : t('App_limit_reached');
		}

		if (enabled > limit) {
			return context === 'private' ? t('Private_apps_limit_exceeded') : t('App_limit_exceeded');
		}

		return t('Apps_Currently_Enabled', { context: context === 'private' ? context : '', enabled, limit });
	};

	const getContent = () => {
		if (enabled === limit) {
			return t('Enable_of_limit_apps_currently_enabled', { context: context === 'private' ? context : '', enabled, limit, appName });
		}

		if (enabled > limit) {
			return t('Enable_of_limit_apps_currently_enabled_exceeded', {
				...(context === 'private' && { context }),
				enabled,
				limit,
				exceed: enabled - limit + 1,
				appName,
			});
		}

		return t('Workspaces_on_Community_edition_install_app', { context: context === 'private' ? context : '', enabled, limit });
	};

	const confirmButtonOverlimitLabel = context === 'private' ? t('Upload_anyway') : t('Install_anyway');

	return (
		<>
			<Modal>
				<Modal.Header>
					<Modal.HeaderText>
						<Modal.Title>{getTitle()}</Modal.Title>
					</Modal.HeaderText>
					<Modal.Close onClick={handleClose} />
				</Modal.Header>

				<Modal.Content>
					<MarkdownText content={getContent()} />
				</Modal.Content>

				<Modal.Footer>
					<Modal.FooterControllers>
						<Button onClick={handleEnableUnlimitedApps}>{t('Enable_unlimited_apps')}</Button>
						<Button {...(enabled < limit && { primary: true })} onClick={handleConfirm}>
							{enabled < limit ? t('Next') : confirmButtonOverlimitLabel}
						</Button>
					</Modal.FooterControllers>
				</Modal.Footer>
			</Modal>
		</>
	);
};

export default AppInstallationModal;
