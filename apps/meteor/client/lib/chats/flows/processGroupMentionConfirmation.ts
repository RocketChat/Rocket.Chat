import type { IMessage } from '@rocket.chat/core-typings';
import { GenericModal, imperativeModal } from '@rocket.chat/ui-client';

import { t } from '../../../../app/utils/lib/i18n';
import { settings } from '../../settings';
import type { ChatAPI } from '../ChatAPI';

const GROUP_MENTION_REGEX = /(?:^|\s|>)@(all|here)\b/;

/**
 * Checks whether the message contains a @all or @here mention and, if the
 * room's member count is at or above `Message_ConfirmGroupMentions_MinMembers`,
 * shows a confirmation modal before allowing the message to be sent.
 *
 * Returns `true` when the send should be **aborted** (user cancelled),
 * `false` when the send should continue.
 */
export const processGroupMentionConfirmation = async (chat: ChatAPI, { msg }: Pick<IMessage, 'msg'>): Promise<boolean> => {
	const confirmEnabled = settings.peek('Message_ConfirmGroupMentions');

	if (!confirmEnabled) {
		return false;
	}

	if (!GROUP_MENTION_REGEX.test(msg)) {
		return false;
	}

	// Use the room's local `usersCount` — already present in the Rooms store,
	// so no extra network request is required.
	const room = await chat.data.findRoom();
	if (!room) {
		return false;
	}

	const memberCount: number = room.usersCount ?? 0;
	const maxAll: number = settings.peek<number>('Message_MaxAll') ?? 0;

	// If channel size exceeds Message_MaxAll, the server will reject the mention anyway.
	if (maxAll > 0 && memberCount > maxAll) {
		return false;
	}

	const minMembers: number = settings.peek<number>('Message_ConfirmGroupMentions_MinMembers') ?? 0;

	if (minMembers > 0 && memberCount < minMembers) {
		return false;
	}

	// Show a confirmation modal and wait for the user's choice.
	const shouldAbort = await new Promise<boolean>((resolve) => {
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
				title: t('Group_mention_confirm_title'),
				children: t('Group_mention_confirm_description', { count: memberCount }),
				onConfirm,
				onClose,
				onCancel: onClose,
				variant: 'warning',
				confirmText: t('Send_anyway'),
				cancelText: t('Cancel'),
			},
		});
	});

	return shouldAbort;
};
