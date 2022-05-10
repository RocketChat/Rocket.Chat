import { Box, ButtonGroup, Button, Icon, Modal } from '@rocket.chat/fuselage';
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
				<Modal.Title display='flex'>
					<Box mie='x12'>
						<Icon size='x20' name='modal-warning' color='warning-700' />
					</Box>
					{t('Confirmation')}
				</Modal.Title>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content>{content}</Modal.Content>
			<Modal.Footer>
				<ButtonGroup align='end'>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button onClick={handleConfirm} primary danger>
						{labelButton}
					</Button>
				</ButtonGroup>
			</Modal.Footer>
		</Modal>
	);
};

export default memo(ConfirmationModal);
