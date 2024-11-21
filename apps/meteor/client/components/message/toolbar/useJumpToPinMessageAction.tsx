import { useEffect } from 'react';

import { MessageAction } from '../../../../app/ui-utils/client/lib/MessageAction';
import { setMessageJumpQueryStringParameter } from '../../../lib/utils/setMessageJumpQueryStringParameter';

export const useJumpToPinMessageAction = () => {
	useEffect(() => {
		MessageAction.addButton({
			id: 'jump-to-pin-message',
			icon: 'jump',
			label: 'Jump_to_message',
			context: ['pinned', 'message-mobile', 'direct'],
			action(_, { message }) {
				setMessageJumpQueryStringParameter(message._id);
			},
			condition({ subscription }) {
				return !!subscription;
			},
			order: 100,
			group: 'message',
		});

		return () => {
			MessageAction.removeButton('jump-to-pin-message');
		};
	}, []);
};
