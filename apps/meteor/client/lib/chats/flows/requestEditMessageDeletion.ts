import type { IMessage } from '@rocket.chat/core-typings';

import { t } from '../../../../app/utils/lib/i18n';
import GenericModal from '../../../components/GenericModal';
import { imperativeModal } from '../../imperativeModal';
import { dispatchToastMessage } from '../../toast';
import type { ChatAPI } from '../ChatAPI';

export const requestEditMessageDeletion = async (chat: ChatAPI, message: IMessage): Promise<boolean> => {
	if (!(await chat.data.canDeleteMessage(message))) {
		dispatchToastMessage({ type: 'error', message: t('Message_deleting_blocked') });
		return Promise.reject(new Error(t('Message_deleting_blocked')));
	}

	const room = message.drid ? await chat.data.getDiscussionByID(message.drid) : undefined;

	return new Promise<boolean>((resolve, reject) => {
		const onConfirm = async (): Promise<void> => {
			try {
				if (!(await chat.data.canDeleteMessage(message))) {
					dispatchToastMessage({ type: 'error', message: t('Message_deleting_blocked') });
					reject(new Error(t('Message_deleting_blocked')));
				}
				await chat.data.deleteMessage(message);

				imperativeModal.close();

				if (chat.currentEditing?.mid === message._id) {
					chat.currentEditing.stop();
				}
				chat.composer?.focus();

				dispatchToastMessage({ type: 'success', message: t('Your_entry_has_been_deleted') });
				resolve(true);
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
				reject(error);
			}
		};

		const onCloseModal = async (): Promise<void> => {
			imperativeModal.close();

			chat.composer?.focus();

			resolve(false);
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
