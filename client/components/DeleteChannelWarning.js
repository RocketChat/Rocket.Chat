import React from 'react';
import { Button, ButtonGroup, Icon, Modal } from '@rocket.chat/fuselage';

import { useTranslation } from '../contexts/TranslationContext';

const DeleteChannelWarning = ({ onConfirm, onCancel, ...props }) => {
	const t = useTranslation();

	return <Modal {...props}>
		<Modal.Header>
			<Icon color='danger' name='modal-warning' size={20}/>
			<Modal.Title>{t('Are_you_sure')}</Modal.Title>
			<Modal.Close onClick={onCancel}/>
		</Modal.Header>
		<Modal.Content fontScale='p1'>
			{t('Delete_Room_Warning')}
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button onClick={onCancel}>{t('Cancel')}</Button>
				<Button primary danger onClick={onConfirm}>{t('Yes_delete_it')}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;
};

export default DeleteChannelWarning;
