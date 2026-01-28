import { GenericModal } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

type ReturnChatQueueModalProps = {
	onMoveChat: () => void;
	onCancel: () => void;
};

const ReturnChatQueueModal = ({ onCancel, onMoveChat }: ReturnChatQueueModalProps) => {
	const { t } = useTranslation();

	return (
		<GenericModal
			variant='warning'
			title={t('Return_to_the_queue')}
			onConfirm={onMoveChat}
			onCancel={onCancel}
			onClose={onCancel}
			confirmText={t('Confirm')}
		>
			{t('Would_you_like_to_return_the_queue')}
		</GenericModal>
	);
};

export default ReturnChatQueueModal;
