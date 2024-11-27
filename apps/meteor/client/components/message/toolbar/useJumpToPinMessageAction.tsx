import type { IMessage, ISubscription } from '@rocket.chat/core-typings';
import { useEffect } from 'react';

import { MessageAction } from '../../../../app/ui-utils/client/lib/MessageAction';
import { setMessageJumpQueryStringParameter } from '../../../lib/utils/setMessageJumpQueryStringParameter';

export const useJumpToPinMessageAction = (message: IMessage, { subscription }: { subscription: ISubscription | undefined }) => {
	useEffect(() => {
		if (subscription) {
			return;
		}
		MessageAction.addButton({
			id: 'jump-to-pin-message',
			icon: 'jump',
			label: 'Jump_to_message',
			context: ['pinned', 'message-mobile', 'direct'],
			action() {
				setMessageJumpQueryStringParameter(message._id);
			},
			condition() {
				return !!subscription;
			},
			order: 100,
			group: 'message',
		});

		return () => {
			MessageAction.removeButton('jump-to-pin-message');
		};
	}, [message._id, subscription]);
};
