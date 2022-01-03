import { Button, ButtonGroup, Icon, Modal } from '@rocket.chat/fuselage';
import React from 'react';

import { useSetModal } from '../../../contexts/ModalContext';
import { useRoute } from '../../../contexts/RouterContext';
import { useTranslation } from '../../../contexts/TranslationContext';

const CloudLoginModal = (): JSX.Element => {
	const t = useTranslation();
	const setModal = useSetModal();
	const cloudRoute = useRoute('cloud');

	const handleCloseButtonClick = (): void => {
		setModal(null);
	};

	const handleCancelButtonClick = (): void => {
		setModal(null);
	};

	const handleLoginButtonClick = (): void => {
		cloudRoute.push();
		setModal(null);
	};

	return (
		<Modal>
			<Modal.Header>
				<Icon color='danger' name='info-circled' size={20} />
				<Modal.Title>{t('Apps_Marketplace_Login_Required_Title')}</Modal.Title>
				<Modal.Close onClick={handleCloseButtonClick} />
			</Modal.Header>
			<Modal.Content fontScale='p2'>{t('Apps_Marketplace_Login_Required_Description')}</Modal.Content>
			<Modal.Footer>
				<ButtonGroup align='end'>
					<Button ghost onClick={handleCancelButtonClick}>
						{t('Cancel')}
					</Button>
					<Button primary danger onClick={handleLoginButtonClick}>
						{t('Login')}
					</Button>
				</ButtonGroup>
			</Modal.Footer>
		</Modal>
	);
};

export default CloudLoginModal;
