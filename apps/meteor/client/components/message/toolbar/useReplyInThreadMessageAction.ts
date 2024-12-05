import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import type { IMessage, IRoom, ISubscription } from '@rocket.chat/core-typings';
import { useSetting, useRouter } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { MessageAction } from '../../../../app/ui-utils/client';

export const useReplyInThreadMessageAction = (
	message: IMessage,
	{ room, subscription }: { room: IRoom; subscription: ISubscription | undefined },
) => {
	const threadsEnabled = useSetting('Threads_enabled');

	const route = useRouter();

	useEffect(() => {
		if (!threadsEnabled || isOmnichannelRoom(room) || !subscription) {
			return;
		}

		MessageAction.addButton({
			id: 'reply-in-thread',
			icon: 'thread',
			label: 'Reply_in_thread',
			context: ['message', 'message-mobile', 'federated', 'videoconf'],
			action(e) {
				e?.stopPropagation();
				const routeName = route.getRouteName();
				if (routeName) {
					route.navigate({
						name: routeName,
						params: {
							...route.getRouteParameters(),
							tab: 'thread',
							context: message.tmid || message._id,
						},
					});
				}
			},
			order: -1,
			group: 'message',
		});

		return () => MessageAction.removeButton('unfollow-message');
	}, [message._id, message.tmid, room, route, subscription, threadsEnabled]);
};
