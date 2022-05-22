import { Button, ButtonGroup, Icon, Modal } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC } from 'react';

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
				<Icon color='danger' name='info-circled' size={20} />
				<Modal.Title>{t('Apps_Manual_Update_Modal_Title')}</Modal.Title>
				<Modal.Close onClick={handleCloseButtonClick} />
			</Modal.Header>
			<Modal.Content fontScale='p2'>{t('Apps_Manual_Update_Modal_Body')}</Modal.Content>
			<Modal.Footer>
				<ButtonGroup align='end'>
					<Button ghost onClick={handleCancelButtonClick}>
						{t('No')}
					</Button>
					<Button primary danger onClick={handleConfirmButtonClick}>
						{t('Yes')}
					</Button>
				</ButtonGroup>
			</Modal.Footer>
		</Modal>
	);
};

export default AppUpdateModal;
