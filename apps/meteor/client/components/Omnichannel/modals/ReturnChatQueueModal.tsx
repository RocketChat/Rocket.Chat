import { Button, Modal } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

type ReturnChatQueueModalProps = {
	onMoveChat: () => void;
	onCancel: () => void;
};

const ReturnChatQueueModal = ({ onCancel, onMoveChat, ...props }: ReturnChatQueueModalProps) => {
	const { t } = useTranslation();

	return (
		<Modal {...props} data-qa-id='return-to-queue-modal'>
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
