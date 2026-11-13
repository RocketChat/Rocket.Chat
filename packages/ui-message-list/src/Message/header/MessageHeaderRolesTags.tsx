import type { IMessage } from '@rocket.chat/core-typings';

import MessageRoles from './MessageRoles';

export type MessageHeaderRolesTagsProps = {
	message: IMessage;
	workspaceRoles: string[];
	roomRoles: string[];
};

/** The tags of the roles of the author of a message: none for an author without roles who is not a bot. */
const MessageHeaderRolesTags = ({ message, workspaceRoles, roomRoles }: MessageHeaderRolesTagsProps) => {
	if (workspaceRoles.length === 0 && roomRoles.length === 0 && !message.bot) {
		return null;
	}

	return <MessageRoles workspaceRoles={workspaceRoles} roomRoles={roomRoles} isBot={!!message.bot} />;
};

export default MessageHeaderRolesTags;
