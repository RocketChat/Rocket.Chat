import type { IMessage, RequiredField } from '@rocket.chat/core-typings';

import type { MessageActionConditionProps, MessageActionContext, MessageActionConfig } from '../../app/ui-utils/client/lib/MessageAction';
import type { ISlashCommandAddParams } from '../../app/utils/lib/slashCommand';
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

const addSlashCommand = <T extends string>(params: ISlashCommandAddParams<T>) => {
	import('../../app/utils/lib/slashCommand').then(({ slashCommands }) => {
		slashCommands.add(params);
	});

	return () => {
		import('../../app/utils/lib/slashCommand').then(({ slashCommands }) => {
			delete slashCommands.commands[params.command];
		});
	};
};

const removeSlashCommand = (command: string) => {
	import('../../app/utils/lib/slashCommand').then(({ slashCommands }) => {
		delete slashCommands.commands[command];
	});
};

const runSlashCommand = async ({
	command,
	message,
	params,
	triggerId,
	userId,
}: {
	command: string;
	params: string;
	message: RequiredField<Partial<IMessage>, 'rid' | '_id'>;
	userId: string;
	triggerId?: string | undefined;
}) => {
	const { slashCommands } = await import('../../app/utils/lib/slashCommand');
	return slashCommands.run({
		command,
		message,
		params,
		triggerId,
		userId,
	});
};

const getSlashCommands = async () => {
	const { slashCommands } = await import('../../app/utils/lib/slashCommand');
	return slashCommands.commands;
};

export const ui = {
	addMessageAction,
	removeMessageAction,
	getMessageActions,
	getMessageLinkById,
	addRoomAction,
	addSlashCommand,
	removeSlashCommand,
	runSlashCommand,
	getSlashCommands,
} as const;
