import type { IMessage } from '@rocket.chat/core-typings';

import { t } from '../../../../app/utils/client';
import GenericModal from '../../../components/GenericModal';
import { imperativeModal } from '../../imperativeModal';
import { dispatchToastMessage } from '../../toast';
import type { ChatAPI } from '../ChatAPI';

export const requestMessageDeletion = async (chat: ChatAPI, message: IMessage): Promise<void> => {
	if (!(await chat.data.canDeleteMessage(message))) {
		dispatchToastMessage({ type: 'error', message: t('Message_deleting_blocked') });
		return;
	}

	const room = message.drid ? await chat.data.getDiscussionByID(message.drid) : undefined;

	await new Promise<void>((resolve, reject) => {
		const onConfirm = async (): Promise<void> => {
			try {
				if (!(await chat.data.canDeleteMessage(message))) {
					dispatchToastMessage({ type: 'error', message: t('Message_deleting_blocked') });
					return;
				}
				await chat.data.deleteMessage(message._id);

				imperativeModal.close();

				if (chat.currentEditing?.mid === message._id) {
					chat.currentEditing.stop();
				}
				chat.composer?.focus();

				dispatchToastMessage({ type: 'success', message: t('Your_entry_has_been_deleted') });
				resolve();
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
				reject(error);
			}
		};

		const onCloseModal = async (): Promise<void> => {
			imperativeModal.close();

			if (chat.currentEditing?.mid === message._id) {
				chat.currentEditing.stop();
			}
			chat.composer?.focus();

			resolve();
		};

		imperativeModal.open({
			component: GenericModal,
			props: {
				title: t('Are_you_sure'),
				children: room ? t('The_message_is_a_discussion_you_will_not_be_able_to_recover') : t('You_will_not_be_able_to_recover'),
				variant: 'danger',
				confirmText: t('Yes_delete_it'),
				onConfirm,
				onClose: onCloseModal,
				onCancel: onCloseModal,
			},
		});
	});
};
