import type { IMessage } from '@rocket.chat/core-typings';

import MessageRoles from './MessageRoles';
import { useUserRolesByScope } from '../../../hooks/useUserRolesByScope';

type MessageHeaderRolesByScopeProps = {
	message: IMessage;
};

const MessageHeaderRolesByScope = ({ message }: MessageHeaderRolesByScopeProps) => {
	const { workspaceRoles, roomRoles } = useUserRolesByScope(message.u._id, message.rid);

	if (workspaceRoles.length === 0 && roomRoles.length === 0 && !message.bot) {
		return null;
	}

	return <MessageRoles workspaceRoles={workspaceRoles} roomRoles={roomRoles} isBot={!!message.bot} />;
};

export default MessageHeaderRolesByScope;
