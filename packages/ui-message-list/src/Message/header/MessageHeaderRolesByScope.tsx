import type { IMessage } from '@rocket.chat/core-typings';

import MessageHeaderRolesTags from './MessageHeaderRolesTags';
import { useMessageRelatedData } from '../contexts/MessageRelatedDataContext';

export type MessageHeaderRolesByScopeProps = {
	message: IMessage;
};

/** The roles of the author of a message, looked up for the message's own room. */
const MessageHeaderRolesByScope = ({ message }: MessageHeaderRolesByScopeProps) => {
	const { workspaceRoles, roomRoles } = useMessageRelatedData().useUserRoles(message.u._id, message.rid, { enabled: true });

	return <MessageHeaderRolesTags message={message} workspaceRoles={workspaceRoles} roomRoles={roomRoles} />;
};

export default MessageHeaderRolesByScope;
