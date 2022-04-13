import { useUserId } from '@rocket.chat/ui-contexts';
import React from 'react';

import { useRoom } from './contexts/RoomContext';
import RoomMembers from './contextualBar/RoomMembers';
import UserInfo from './contextualBar/UserInfo';
import { useTab, useTabBarClose, useTabContext } from './providers/ToolboxProvider';

const getUid = (room, ownUserId) => {
	if (room.uids?.length === 1) {
		return room.uids[0];
	}

	const uid = room.uids?.filter((uid) => uid !== ownUserId).shift();

	// Self DMs used to be created with the userId duplicated.
	// Sometimes rooms can have 2 equal uids, but it's a self DM.
	return uid || room.uids[0];
};

const MemberListRouter = ({ rid }) => {
	const username = useTabContext();
	const room = useRoom();
	const onClickClose = useTabBarClose();
	const ownUserId = useUserId();
	const tab = useTab();

	const isMembersList = tab.id === 'members-list' || tab.id === 'user-info-group';

	if (isMembersList && !username) {
		return <RoomMembers rid={rid} />;
	}

	return <UserInfo width='100%' {...(username ? { username } : { uid: getUid(room, ownUserId) })} onClose={onClickClose} rid={rid} />;
};

export default MemberListRouter;
