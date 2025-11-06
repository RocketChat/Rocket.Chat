import {
	Button,
	Modal,
	ModalClose,
	ModalContent,
	ModalFooter,
	ModalFooterControllers,
	ModalHeader,
	ModalIcon,
	ModalTitle,
} from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

type ReturnChatQueueModalProps = {
	onMoveChat: () => void;
	onCancel: () => void;
};

const ReturnChatQueueModal = ({ onCancel, onMoveChat, ...props }: ReturnChatQueueModalProps) => {
	const { t } = useTranslation();

	return (
		<Modal {...props} data-qa-id='return-to-queue-modal'>
			<ModalHeader>
				<ModalIcon name='burger-arrow-left' />
				<ModalTitle>{t('Return_to_the_queue')}</ModalTitle>
				<ModalClose onClick={onCancel} />
			</ModalHeader>
			<ModalContent fontScale='p2'>{t('Would_you_like_to_return_the_queue')}</ModalContent>
			<ModalFooter>
				<ModalFooterControllers>
					<Button onClick={onCancel}>{t('Cancel')}</Button>
					<Button primary onClick={onMoveChat}>
						{t('Confirm')}
					</Button>
				</ModalFooterControllers>
			</ModalFooter>
		</Modal>
	);
};

export default ReturnChatQueueModal;
