import { Button, Modal } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { memo, FC } from 'react';

type ConfirmationModalProps = {
	onClose: () => void;
	onConfirmAction: any;
	labelButton: string;
	content: string;
};

const ConfirmationModal: FC<ConfirmationModalProps> = ({ onClose, onConfirmAction, labelButton, content }) => {
	const t = useTranslation();

	const handleConfirm = (): void => {
		onConfirmAction();
		onClose();
	};

	return (
		<Modal>
			<Modal.Header>
				<Modal.Icon name='modal-warning' color='warning-700'></Modal.Icon>
				<Modal.Title>{t('Confirmation')}</Modal.Title>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content>{content}</Modal.Content>
			<Modal.Footer>
				<Modal.FooterControllers>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button onClick={handleConfirm} danger>
						{labelButton}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default memo(ConfirmationModal);
