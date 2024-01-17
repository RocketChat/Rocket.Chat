import { Button, Modal } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import MarkdownText from '../../../../components/MarkdownText';

type UninstallGrandfatheredAppModalProps = {
	context: 'explore' | 'marketplace' | 'private';
	limit: number;
	appName: string;
	handleUninstall: () => void;
	handleClose: () => void;
};

const UninstallGrandfatheredAppModal = ({ context, limit, appName, handleUninstall, handleClose }: UninstallGrandfatheredAppModalProps) => {
	const t = useTranslation();

	return (
		<Modal>
			<Modal.Header>
				<Modal.HeaderText>
					<Modal.Title>{t('Uninstall_grandfathered_app', { appName })}</Modal.Title>
				</Modal.HeaderText>
				<Modal.Close onClick={handleClose} />
			</Modal.Header>
			<Modal.Content>
				<MarkdownText content={t('App_will_lose_grandfathered_status', { limit, context: context === 'private' ? context : '' })} />
			</Modal.Content>
			<Modal.Footer>
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
