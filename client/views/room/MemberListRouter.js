import React from 'react';
// import { Box } from '@rocket.chat/fuselage';

import UserInfo from '../../channel/UserInfo';
import VerticalBarOldActions from './components/VerticalBarOldActions';
import { useRouteParameter } from '../../contexts/RouterContext';
import { useUserId } from '../../contexts/UserContext';
import { useRoom } from './providers/RoomProvider';
import { useTab } from './providers/ToolboxProvider';

const MemberListRouter = ({ tabBar, rid }) => {
	const username = useRouteParameter('context');
	const room = useRoom();
	const ownUserId = useUserId();

	const tab = useTab();

	console.log(room);
	if (tab.id === 'members-list' || tab.id === 'user-info-group') {
		return <VerticalBarOldActions {...tab} name={'membersList'} template={'membersList'} tabBar={tabBar} rid={rid} _id={rid} username={username} />;
	}

	console.log(room);
	return <UserInfo uid={ownUserId} rid={rid}/>;
};

export default MemberListRouter;
