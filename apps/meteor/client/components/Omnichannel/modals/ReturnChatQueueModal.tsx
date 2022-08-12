import { Button, Modal } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC } from 'react';

type ReturnChatQueueModalProps = {
	onMoveChat: () => void;
	onCancel: () => void;
};

const ReturnChatQueueModal: FC<ReturnChatQueueModalProps> = ({ onCancel, onMoveChat, ...props }) => {
	const t = useTranslation();

	return (
		<Modal {...props}>
			<Modal.Header>
				<Modal.Icon name='burger-arrow-left' />
				<Modal.Title>{t('Return_to_the_queue')}</Modal.Title>
				<Modal.Close onClick={onCancel} />
			</Modal.Header>
			<Modal.Content fontScale='p2'>{t('Would_you_like_to_return_the_queue')}</Modal.Content>
			<Modal.Footer>
				<Modal.FooterControllers>
					<Button onClick={onCancel}>{t('Cancel')}</Button>
					<Button primary onClick={onMoveChat}>
						{t('Confirm')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default ReturnChatQueueModal;
