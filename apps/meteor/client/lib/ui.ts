import type { IMessage } from '@rocket.chat/core-typings';

import type { MessageActionConditionProps, MessageActionContext } from '../../app/ui-utils/client/lib/MessageAction';
import { type MessageActionConfig } from '../../app/ui-utils/client/lib/MessageAction';

const addMessageAction = (config: MessageActionConfig) => {
	import('../../app/ui-utils/client/lib/MessageAction').then(({ MessageAction }) => {
		MessageAction.addButton(config);
	});

	return () => {
		import('../../app/ui-utils/client/lib/MessageAction').then(({ MessageAction }) => {
			MessageAction.removeButton(config.id);
		});
	};
};

const removeMessageAction = (id: MessageActionConfig['id']) => {
	import('../../app/ui-utils/client/lib/MessageAction').then(({ MessageAction }) => {
		MessageAction.removeButton(id);
	});
};

const getMessageActions = async (props: MessageActionConditionProps, context: MessageActionContext, group: 'message' | 'menu') => {
	const { MessageAction } = await import('../../app/ui-utils/client/lib/MessageAction');
	return MessageAction.getButtons(props, context, group);
};

/** @deprecated it should not be that related to data */
const getMessageLinkById = async (mid: IMessage['_id']) => {
	const { MessageAction } = await import('../../app/ui-utils/client/lib/MessageAction');
	return MessageAction.getPermaLink(mid);
};

export const ui = {
	addMessageAction,
	removeMessageAction,
	getMessageActions,
	getMessageLinkById,
} as const;
