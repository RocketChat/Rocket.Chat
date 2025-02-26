import { Button, Modal } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import MarkdownText from '../../../../components/MarkdownText';

type AppsInstallationModalProps = {
	enabled: number;
	limit: number;
	appName: string;
	handleClose: () => void;
	handleConfirm: () => void;
	handleEnableUnlimitedApps: () => void;
};

const AppInstallationModal = ({
	enabled,
	limit,
	appName,
	handleClose,
	handleConfirm,
	handleEnableUnlimitedApps,
}: AppsInstallationModalProps) => {
	const { t } = useTranslation();

	const getTitle = () => {
		if (enabled === limit) {
			return t('App_limit_reached');
		}

		if (enabled > limit) {
			return t('App_limit_exceeded');
		}

		return t('Apps_Currently_Enabled', { context: '', enabled, limit });
	};

	const getContent = () => {
		if (enabled === limit) {
			return t('Enable_of_limit_apps_currently_enabled', { context: '', enabled, limit, appName });
		}

		if (enabled > limit) {
			return t('Enable_of_limit_apps_currently_enabled_exceeded', {
				enabled,
				limit,
				exceed: enabled - limit + 1,
				appName,
			});
		}

		return t('Workspaces_on_Community_edition_install_app', { context: '', enabled, limit });
	};

	const confirmButtonOverLimitLabel = t('Install_anyway');

	return (
		<>
			<Modal>
				<Modal.Header>
					<Modal.HeaderText>
						<Modal.Title data-qa-id='confirm-app-upload-modal-title'>{getTitle()}</Modal.Title>
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
							{enabled < limit ? t('Next') : confirmButtonOverLimitLabel}
						</Button>
					</Modal.FooterControllers>
				</Modal.Footer>
			</Modal>
		</>
	);
};

export default AppInstallationModal;
