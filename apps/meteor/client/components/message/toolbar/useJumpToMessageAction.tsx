import type { IMessage } from '@rocket.chat/core-typings';
import { useEffect } from 'react';

import { MessageAction } from '../../../../app/ui-utils/client/lib/MessageAction';
import { setMessageJumpQueryStringParameter } from '../../../lib/utils/setMessageJumpQueryStringParameter';

export const useJumpToMessageAction = (message: IMessage) => {
	useEffect(() => {
		MessageAction.addButton({
			id: 'jump-to-message',
			icon: 'jump',
			label: 'Jump_to_message',
			context: ['mentions', 'threads', 'videoconf-threads'],
			action() {
				setMessageJumpQueryStringParameter(message._id);
			},
			order: 100,
			group: 'message',
		});

		return () => {
			MessageAction.removeButton('star-message');
		};
	}, [message]);
};
