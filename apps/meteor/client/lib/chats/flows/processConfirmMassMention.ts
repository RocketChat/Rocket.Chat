import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { GenericModal, imperativeModal } from '@rocket.chat/ui-client';

import { t } from '../../../../app/utils/lib/i18n';
import { settings } from '../../settings';
import type { ChatAPI } from '../ChatAPI';

export const processConfirmMassMention = async (chat: ChatAPI, { msg }: Pick<IMessage, 'msg'>): Promise<boolean> => {
	const confirmAll = settings.peek('Message_ConfirmAll');

	if (!confirmAll) {
		return false;
	}

	const hasMassMention = /\B@(all|here)\b/i.test(msg);
	if (!hasMassMention) {
		return false;
	}

	let room: IRoom;
	try {
		room = await chat.data.getRoom();
	} catch (error) {
		console.error('Failed to get room data for mass mention confirmation:', error);
		return false;
	}

	const minMembers = settings.peek<number>('Message_ConfirmAll_MinMembers') ?? 0;

	if (!room || (room.usersCount ?? 0) < minMembers) {
		return false;
	}

	return new Promise<boolean>((resolve) => {
		const onConfirm = (): void => {
			imperativeModal.close();
			resolve(false);
		};

		const onClose = (): void => {
			imperativeModal.close();
			resolve(true);
		};

		imperativeModal.open({
			component: GenericModal,
			props: {
				title: t('Confirm_Mass_Mention_Title'),
				children: t('Confirm_Mass_Mention_Message', { count: room.usersCount ?? 0 }),
				onConfirm,
				onClose,
				onCancel: onClose,
				variant: 'warning',
				confirmText: t('Confirm_Mass_Mention_Button'),
			},
		});
	});
};
