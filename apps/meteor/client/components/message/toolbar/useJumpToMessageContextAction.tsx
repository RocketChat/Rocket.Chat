import type { IMessage } from '@rocket.chat/core-typings';
import { useEffect } from 'react';

import type { MessageActionContext } from '../../../../app/ui-utils/client/lib/MessageAction';
import { MessageAction } from '../../../../app/ui-utils/client/lib/MessageAction';
import { setMessageJumpQueryStringParameter } from '../../../lib/utils/setMessageJumpQueryStringParameter';

export const useJumpToMessageContextAction = (
	message: IMessage,
	{ id, order, hidden, context }: { id: string; order: number; hidden?: boolean; context: MessageActionContext[] },
) => {
	useEffect(() => {
		if (hidden) {
			return;
		}

		MessageAction.addButton({
			id,
			icon: 'jump',
			label: 'Jump_to_message',
			context,
			async action() {
				setMessageJumpQueryStringParameter(message._id);
			},
			order,
			group: 'message',
		});

		return () => {
			MessageAction.removeButton(id);
		};
	}, [hidden, context, id, message._id, order]);
};
