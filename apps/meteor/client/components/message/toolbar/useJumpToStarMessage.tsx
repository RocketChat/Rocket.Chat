import type { IMessage, ISubscription, IUser } from '@rocket.chat/core-typings';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { MessageAction } from '../../../../app/ui-utils/client/lib/MessageAction';
import { setMessageJumpQueryStringParameter } from '../../../lib/utils/setMessageJumpQueryStringParameter';

export const useJumpToStarMessage = (
	message: IMessage,
	{ subscription, user }: { subscription: ISubscription | undefined; user: IUser | undefined },
) => {
	const allowStarring = useSetting('Message_AllowStarring');

	useEffect(() => {
		if (!allowStarring || !subscription) {
			return;
		}

		if (Array.isArray(message.starred) && message.starred.some((star) => star._id === user?._id)) {
			return;
		}

		MessageAction.addButton({
			id: 'jump-to-star-message',
			icon: 'jump',
			label: 'Jump_to_message',
			context: ['starred', 'threads', 'message-mobile', 'videoconf-threads'],
			action() {
				setMessageJumpQueryStringParameter(message._id);
			},
			order: 100,
			group: 'message',
		});

		return () => {
			MessageAction.removeButton('jump-to-star-message');
		};
	}, [allowStarring, message._id, message.starred, subscription, user?._id]);
};
