import type { IMessage } from '@rocket.chat/core-typings';

import type { MessageActionConditionProps, MessageActionContext } from '../../app/ui-utils/client/lib/MessageAction';
import { type MessageActionConfig } from '../../app/ui-utils/client/lib/MessageAction';
import type { ToolboxAction } from '../views/room/lib/Toolbox';

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

const addRoomAction = (id: string, action: ToolboxAction) => {
	import('../views/room/lib/Toolbox').then(({ addAction }) => {
		addAction(id, action);
	});

	return () => {
		import('../views/room/lib/Toolbox').then(({ deleteAction }) => {
			deleteAction(id);
		});
	};
};

const removeRoomAction = (id: string) => {
	import('../views/room/lib/Toolbox').then(({ deleteAction }) => {
		deleteAction(id);
	});
};

export const ui = {
	addMessageAction,
	removeMessageAction,
	getMessageActions,
	getMessageLinkById,
	addRoomAction,
	removeRoomAction,
} as const;
