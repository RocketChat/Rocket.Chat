import { useSetting } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { MessageAction } from '../../../../app/ui-utils/client/lib/MessageAction';
import { setMessageJumpQueryStringParameter } from '../../../lib/utils/setMessageJumpQueryStringParameter';

export const useJumpToStarMessage = () => {
	const allowStarring = useSetting('Message_AllowStarring');

	useEffect(() => {
		if (!allowStarring) {
			return () => {
				MessageAction.removeButton('jump-to-star-message');
			};
		}

		MessageAction.addButton({
			id: 'jump-to-star-message',
			icon: 'jump',
			label: 'Jump_to_message',
			context: ['starred', 'threads', 'message-mobile', 'videoconf-threads'],
			action(_, { message }) {
				setMessageJumpQueryStringParameter(message._id);
			},
			condition({ message, subscription, user }) {
				if (subscription == null) {
					return false;
				}

				return Boolean(message.starred?.find((star) => star._id === user?._id));
			},
			order: 100,
			group: 'message',
		});

		return () => {
			MessageAction.removeButton('jump-to-star-message');
		};
	}, [allowStarring]);
};
