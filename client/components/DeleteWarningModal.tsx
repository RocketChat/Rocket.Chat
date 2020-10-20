import { Button, ButtonGroup, Icon, Modal } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import { useTranslation } from '../contexts/TranslationContext';

type DeleteWarningModalProps = {
	cancelText?: string;
	deleteText?: string;
	onDelete: () => void;
	onCancel: () => void;
};

const DeleteWarningModal: FC<DeleteWarningModalProps> = ({
	children,
	cancelText,
	deleteText,
	onCancel,
	onDelete,
	...props
}) => {
	const t = useTranslation();

	return <Modal {...props}>
		<Modal.Header>
			<Icon color='danger' name='modal-warning' size={20}/>
			<Modal.Title>{t('Are_you_sure')}</Modal.Title>
			<Modal.Close onClick={onCancel}/>
		</Modal.Header>
		<Modal.Content fontScale='p1'>
			{children}
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button ghost onClick={onCancel}>{cancelText ?? t('Cancel')}</Button>
				<Button primary danger onClick={onDelete}>{deleteText ?? t('Delete')}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;
};

export default DeleteWarningModal;
