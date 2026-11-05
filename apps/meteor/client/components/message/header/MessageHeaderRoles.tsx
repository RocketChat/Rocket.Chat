import type { IMessage } from '@rocket.chat/core-typings';
import type { MouseEventHandler } from 'react';

import MessageHeaderRolesByScope from './MessageHeaderRolesByScope';
import MessageRoles from './MessageRoles';
import { useMessageListUserRoles } from '../list/MessageListContext';

type MessageHeaderRolesProps = {
	message: IMessage;
	onClick?: MouseEventHandler;
};

const MessageHeaderRoles = ({ message, onClick }: MessageHeaderRolesProps) => {
	const rolesFromList = useMessageListUserRoles(message.u._id, message.rid);

	if (!rolesFromList) {
		return <MessageHeaderRolesByScope message={message} onClick={onClick} />;
	}

	const { workspaceRoles, roomRoles } = rolesFromList;

	if (workspaceRoles.length === 0 && roomRoles.length === 0 && !message.bot) {
		return null;
	}

	return <MessageRoles workspaceRoles={workspaceRoles} roomRoles={roomRoles} isBot={!!message.bot} onClick={onClick} />;
};

export default MessageHeaderRoles;
