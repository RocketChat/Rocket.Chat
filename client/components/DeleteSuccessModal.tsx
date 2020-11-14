import React, { FC } from 'react';
import { Button, ButtonGroup, Icon, Modal } from '@rocket.chat/fuselage';

import { useTranslation } from '../contexts/TranslationContext';

type DeleteSuccessModalProps = {
	onClose: () => void;
};

const DeleteSuccessModal: FC<DeleteSuccessModalProps> = ({
	children,
	onClose,
	...props
}) => {
	const t = useTranslation();
	return <Modal {...props}>
		<Modal.Header>
			<Icon color='success' name='checkmark-circled' size={20}/>
			<Modal.Title>{t('Deleted')}</Modal.Title>
			<Modal.Close onClick={onClose}/>
		</Modal.Header>
		<Modal.Content fontScale='p1'>
			{children}
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button primary onClick={onClose}>{t('Ok')}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;
};

export default DeleteSuccessModal;
