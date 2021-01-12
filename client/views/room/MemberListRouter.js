import React from 'react';

import UserInfo from './contextualBar/UserInfo';
import { useUserId } from '../../contexts/UserContext';
import { useRoom } from './providers/RoomProvider';
import { useTab, useTabBarClose, useTabContext } from './providers/ToolboxProvider';
import RoomMembers from './contextualBar/RoomMembers';

const MemberListRouter = ({ rid }) => {
	const username = useTabContext();
	const room = useRoom();
	const onClickClose = useTabBarClose();
	const ownUserId = useUserId();
	const tab = useTab();

	const isMembersList = tab.id === 'members-list' || tab.id === 'user-info-group';

	if (isMembersList && !username) {
		return <RoomMembers rid={rid}/>;
	}

	return <UserInfo width='100%' {...username ? { username } : { uid: room.uids.filter((uid) => uid !== ownUserId).shift() }} onClose={onClickClose} rid={rid}/>;
};

export default MemberListRouter;
