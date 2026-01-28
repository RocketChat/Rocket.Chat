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
			//model to genericmodel
			variant='warning'
			icon='burger-arrow-left'
			title={t('Return_to_the_queue')}
			confirmText={t('Confirm')}
			cancelText={t('Cancel')}
			onConfirm={onMoveChat}
			onCancel={onCancel}
		>
			{t('Would_you_like_to_return_the_queue')}
		</GenericModal>
	);
};

export default ReturnChatQueueModal;
