import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import type { ISubscription, IMessage, IRoom } from '@rocket.chat/core-typings';
import { useRouter, useUser } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { MessageAction } from '../../../../app/ui-utils/client';
import { useMarkAsUnreadMutation } from '../hooks/useMarkAsUnreadMutation';

export const useMarkAsUnreadMessageAction = (
	message: IMessage,
	{ room, subscription }: { room: IRoom; subscription: ISubscription | undefined },
) => {
	const user = useUser();
	const { mutateAsync: markAsUnread } = useMarkAsUnreadMutation();

	const router = useRouter();

	useEffect(() => {
		if (isOmnichannelRoom(room) || !user) {
			return;
		}

		if (!subscription) {
			return;
		}

		if (message.u._id === user._id) {
			return;
		}

		MessageAction.addButton({
			id: 'mark-message-as-unread',
			icon: 'flag',
			label: 'Mark_unread',
			context: ['message', 'message-mobile', 'threads'],
			type: 'interaction',
			async action() {
				router.navigate('/home');
				await markAsUnread({ message, subscription });
			},
			order: 4,
			group: 'menu',
		});
		return () => {
			MessageAction.removeButton('mark-message-as-unread');
		};
	}, [markAsUnread, message, room, router, subscription, user]);
};
