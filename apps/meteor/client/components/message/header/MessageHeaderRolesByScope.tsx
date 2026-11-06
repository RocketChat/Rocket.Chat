import type { IMessage } from '@rocket.chat/core-typings';
import type { MouseEventHandler } from 'react';

import MessageRoles from './MessageRoles';
import { useUserRolesByScope } from '../../../hooks/useUserRolesByScope';

type MessageHeaderRolesByScopeProps = {
	message: IMessage;
	onClick?: MouseEventHandler;
};

const MessageHeaderRolesByScope = ({ message, onClick }: MessageHeaderRolesByScopeProps) => {
	const { workspaceRoles, roomRoles } = useUserRolesByScope(message.u._id, message.rid);

	if (workspaceRoles.length === 0 && roomRoles.length === 0 && !message.bot) {
		return null;
	}

	return <MessageRoles workspaceRoles={workspaceRoles} roomRoles={roomRoles} isBot={!!message.bot} onClick={onClick} />;
};

export default MessageHeaderRolesByScope;
