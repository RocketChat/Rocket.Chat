import { Button, Modal } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import MarkdownText from '../../../../components/MarkdownText';

type AppsInstallationModalProps = {
	context: 'private' | 'explore' | 'marketplace';
	enable: number;
	limit: number;
	appName: string;
};

const AppInstallationModal = ({ context, enable, limit, appName }: AppsInstallationModalProps) => {
	const t = useTranslation();

	const getTitle = () => {
		if (enable === limit) {
			return context === 'private' ? t('Private_apps_limit_reached') : t('App_limit_reached');
		}

		if (enable > limit) {
			return context === 'private' ? t('Private_apps_limit_exceeded') : t('App_limit_exceeded');
		}

		return t('Apps_Currently_Enabled', { ...(context === 'private' && { context }), enable, limit });
	};

	const getContent = () => {
		if (enable === limit) {
			return t('Enable_of_limit_apps_currently_enabled', { ...(context === 'private' && { context }), enable, limit, appName });
		}

		if (enable > limit) {
			return t('Enable_of_limit_apps_currently_enabled_exceeded', {
				...(context === 'private' && { context }),
				enable,
				limit,
				exceed: enable - limit + 1,
				appName,
			});
		}

		return t('Workspaces_on_Community_edition_install_app', { ...(context === 'private' && { context }), enable, limit });
	};

	return (
		<>
			<Modal>
				<Modal.Header>
					<Modal.HeaderText>
						<Modal.Title>{getTitle()}</Modal.Title>
					</Modal.HeaderText>
					<Modal.Close />
				</Modal.Header>

				<Modal.Content>
					<MarkdownText content={getContent()} />
				</Modal.Content>

				<Modal.Footer>
					<Modal.FooterControllers>
						<Button>{t('Enable_unlimited_apps')}</Button>
						{enable >= limit ? <Button>{t('Upload_anyway')}</Button> : <Button primary>{t('Next')}</Button>}
					</Modal.FooterControllers>
				</Modal.Footer>
			</Modal>
		</>
	);
};

export default AppInstallationModal;
