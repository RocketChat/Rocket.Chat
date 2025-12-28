import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { GenericModal } from '@rocket.chat/ui-client';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import type { ChatAPI } from '../../../../lib/chats/ChatAPI';

const DeleteMessageConfirmModal = ({
	room,
	chat,
	resolve,
	reject,
	onCancel,
	message,
}: {
	room?: IRoom;
	chat: ChatAPI;
	resolve: () => void;
	reject: (reason?: any) => void;
	message: IMessage;
	onCancel: () => void;
}) => {
	const { t } = useTranslation();
	const mid = chat.currentEditingMessage.getMID();
	const dispatchToastMessage = useToastMessageDispatch();

	const deleteMessageMutation = useMutation({
		mutationFn: async () => {
			if (!(await chat.data.canDeleteMessage(message))) {
				throw new Error(t('Message_deleting_blocked'));
			}

			await chat.data.deleteMessage(message);
		},
		onSuccess: () => {
			if (mid === message._id) {
				chat.currentEditingMessage.stop();
			}
			chat.composer?.focus();

			dispatchToastMessage({ type: 'success', message: t('Your_entry_has_been_deleted') });
			resolve();
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
			reject(error);
		},
		onSettled: () => {
			onCancel();
		},
	});

	return (
		<GenericModal
			variant='danger'
			title={t('Are_you_sure')}
			confirmText={t('Yes_delete_it')}
			children={room ? t('The_message_is_a_discussion_you_will_not_be_able_to_recover') : t('You_will_not_be_able_to_recover')}
			onConfirm={deleteMessageMutation.mutate}
			onCancel={onCancel}
			confirmDisabled={deleteMessageMutation.isPending}
		/>
	);
};

export default DeleteMessageConfirmModal;
