import type { IMessage } from '@rocket.chat/core-typings';

import MessageHeaderRolesByScope from './MessageHeaderRolesByScope';
import MessageHeaderRolesTags from './MessageHeaderRolesTags';
import { useMessageRelatedData } from '../contexts/MessageRelatedDataContext';

export type MessageHeaderRolesProps = {
	message: IMessage;
};

/** The roles of the author of a message, from what the place resolved for its list, else looked up for the message's room. */
const MessageHeaderRoles = ({ message }: MessageHeaderRolesProps) => {
	const rolesFromPlace = useMessageRelatedData().usePlaceUserRoles(message.u._id, message.rid);

	if (!rolesFromPlace) {
		return <MessageHeaderRolesByScope message={message} />;
	}

	return <MessageHeaderRolesTags message={message} workspaceRoles={rolesFromPlace.workspaceRoles} roomRoles={rolesFromPlace.roomRoles} />;
};

export default MessageHeaderRoles;
