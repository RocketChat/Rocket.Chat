import type { IMessage } from '@rocket.chat/core-typings';
import { imperativeModal } from '@rocket.chat/ui-client';

import { t } from '../../../../app/utils/lib/i18n';
import DeleteMessageConfirmModal from '../../../views/room/modals/DeleteMessageConfirmModal';
import { dispatchToastMessage } from '../../toast';
import type { ChatAPI } from '../ChatAPI';

export const requestMessageDeletion = async (chat: ChatAPI, message: IMessage): Promise<void> => {
	if (!(await chat.data.canDeleteMessage(message))) {
		dispatchToastMessage({ type: 'error', message: t('Message_deleting_blocked') });
		return;
	}

	const room = message.drid ? await chat.data.getDiscussionByID(message.drid) : undefined;

	await new Promise<void>((resolve, reject) => {
		const mid = chat.currentEditingMessage.getMID();

		const onCloseModal = async (): Promise<void> => {
			imperativeModal.close();

			if (mid === message._id) {
				chat.currentEditingMessage.stop();
			}
			chat.composer?.focus();

			resolve();
		};

		imperativeModal.open({
			component: DeleteMessageConfirmModal,
			props: {
				room,
				chat,
				resolve,
				reject,
				message,
				onCancel: onCloseModal,
			},
		});
	});
};
