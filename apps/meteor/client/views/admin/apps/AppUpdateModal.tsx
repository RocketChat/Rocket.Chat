import { Button, Modal } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React from 'react';

type AppUpdateModalProps = {
	confirm: () => void;
	cancel: () => void;
};

const AppUpdateModal: FC<AppUpdateModalProps> = ({ confirm, cancel, ...props }) => {
	const t = useTranslation();

	const handleCloseButtonClick = (): void => {
		cancel();
	};

	const handleCancelButtonClick = (): void => {
		cancel();
	};

	const handleConfirmButtonClick = (): void => {
		confirm();
	};

	return (
		<Modal {...props}>
			<Modal.Header>
				<Modal.Icon color='danger' name='info-circled' />
				<Modal.Title>{t('Apps_Manual_Update_Modal_Title')}</Modal.Title>
				<Modal.Close onClick={handleCloseButtonClick} />
			</Modal.Header>
			<Modal.Content fontScale='p2'>{t('Apps_Manual_Update_Modal_Body')}</Modal.Content>
			<Modal.Footer>
				<Modal.FooterControllers>
					<Button secondary onClick={handleCancelButtonClick}>
						{t('No')}
					</Button>
					<Button danger onClick={handleConfirmButtonClick}>
						{t('Yes')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default AppUpdateModal;
