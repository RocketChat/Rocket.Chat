import { Button, Modal } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import React from 'react';
import { useTranslation } from 'react-i18next';

import MarkdownText from '../../../components/MarkdownText';
import { useExternalLink } from '../../../hooks/useExternalLink';
import { useCheckoutUrl } from '../../admin/subscription/hooks/useCheckoutUrl';
import { useAppsCountQuery } from '../hooks/useAppsCountQuery';
import { useMarketplaceContext } from '../hooks/useMarketplaceContext';

type AppsInstallationModalProps = {
	appName: string;
	onInstall: () => void;
	onClose: () => void;
};

const AppInstallationModal = ({ appName, onInstall, onClose }: AppsInstallationModalProps) => {
	const { t } = useTranslation();

	const { isSuccess, data } = useAppsCountQuery(useMarketplaceContext());

	const manageSubscriptionUrl = useCheckoutUrl()({ target: 'user-page', action: 'buy_more' });
	const openExternalLink = useExternalLink();

	const handleEnableUnlimitedAppsButtonClick = useEffectEvent(() => {
		openExternalLink(manageSubscriptionUrl);
		onClose();
	});

	if (!isSuccess) {
		return null;
	}

	const { enabled, limit } = data;

	// TODO: break each case into a separate component

	if (enabled === limit) {
		return (
			<Modal>
				<Modal.Header>
					<Modal.HeaderText>
						<Modal.Title data-qa-id='confirm-app-upload-modal-title'>{t('App_limit_reached')}</Modal.Title>
					</Modal.HeaderText>
					<Modal.Close onClick={onClose} />
				</Modal.Header>

				<Modal.Content>
					<MarkdownText content={t('Enable_of_limit_apps_currently_enabled', { context: '', enabled, limit, appName })} />
				</Modal.Content>

				<Modal.Footer>
					<Modal.FooterControllers>
						<Button onClick={handleEnableUnlimitedAppsButtonClick}>{t('Enable_unlimited_apps')}</Button>
						<Button onClick={onInstall}>{t('Install_anyway')}</Button>
					</Modal.FooterControllers>
				</Modal.Footer>
			</Modal>
		);
	}

	if (enabled > limit) {
		return (
			<Modal>
				<Modal.Header>
					<Modal.HeaderText>
						<Modal.Title data-qa-id='confirm-app-upload-modal-title'>{t('App_limit_exceeded')}</Modal.Title>
					</Modal.HeaderText>
					<Modal.Close onClick={onClose} />
				</Modal.Header>

				<Modal.Content>
					<MarkdownText
						content={t('Enable_of_limit_apps_currently_enabled_exceeded', {
							enabled,
							limit,
							exceed: enabled - limit + 1,
							appName,
						})}
					/>
				</Modal.Content>

				<Modal.Footer>
					<Modal.FooterControllers>
						<Button onClick={handleEnableUnlimitedAppsButtonClick}>{t('Enable_unlimited_apps')}</Button>
						<Button onClick={onInstall}>{t('Install_anyway')}</Button>
					</Modal.FooterControllers>
				</Modal.Footer>
			</Modal>
		);
	}

	return (
		<Modal>
			<Modal.Header>
				<Modal.HeaderText>
					<Modal.Title data-qa-id='confirm-app-upload-modal-title'>
						{t('Apps_Currently_Enabled', { context: '', enabled, limit })}
					</Modal.Title>
				</Modal.HeaderText>
				<Modal.Close onClick={onClose} />
			</Modal.Header>

			<Modal.Content>
				<MarkdownText content={t('Workspaces_on_Community_edition_install_app', { context: '', enabled, limit })} />
			</Modal.Content>

			<Modal.Footer>
				<Modal.FooterControllers>
					<Button onClick={handleEnableUnlimitedAppsButtonClick}>{t('Enable_unlimited_apps')}</Button>
					<Button primary onClick={onInstall}>
						{t('Next')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default AppInstallationModal;
