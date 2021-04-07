import { Button, ButtonGroup, Icon, Modal } from '@rocket.chat/fuselage';
import React from 'react';

import { useTranslation } from '../../../contexts/TranslationContext';

const AppUpdateModal = ({ confirm, cancel, ...props }) => {
	const t = useTranslation();

	const handleCloseButtonClick = () => {
		cancel();
	};

	const handleCancelButtonClick = () => {
		cancel();
	};

	const handleConfirmButtonClick = () => {
		confirm();
	};

	return <Modal {...props}>
		<Modal.Header>
			<Icon color='danger' name='info-circled' size={20}/>
			<Modal.Title>This app is already installed</Modal.Title>
			<Modal.Close onClick={handleCloseButtonClick}/>
		</Modal.Header>
		<Modal.Content fontScale='p1'>
    Do you want to update it?
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button ghost onClick={handleCancelButtonClick}>No</Button>
				<Button primary danger onClick={handleConfirmButtonClick}>Yes</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;
};

export default AppUpdateModal;
