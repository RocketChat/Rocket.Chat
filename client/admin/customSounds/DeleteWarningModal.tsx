import React, { FC } from 'react';
import { Button, ButtonGroup, Icon, Modal } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';

type DeleteWarningModalProps = {
	onDelete: () => void;
	onCancel: () => void;
};

const DeleteWarningModal: FC<DeleteWarningModalProps> = ({ onDelete, onCancel, ...props }) => {
	const t = useTranslation();
	return <Modal {...props}>
		<Modal.Header>
			<Icon color='danger' name='modal-warning' size={20}/>
			<Modal.Title>{t('Are_you_sure')}</Modal.Title>
			<Modal.Close onClick={onCancel}/>
		</Modal.Header>
		<Modal.Content fontScale='p1'>
			{t('Custom_Sound_Delete_Warning')}
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button ghost onClick={onCancel}>{t('Cancel')}</Button>
				<Button primary danger onClick={onDelete}>{t('Delete')}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;
};

export default DeleteWarningModal;
