import React from 'react';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import UserInfo from './contextualBar/UserInfo';
import VerticalBarOldActions from './components/VerticalBarOldActions';
import { useRouteParameter, useRoute, useCurrentRoute } from '../../contexts/RouterContext';
import { useUserId } from '../../contexts/UserContext';
import { useRoom } from './providers/RoomProvider';
import { useTab } from './providers/ToolboxProvider';

const MemberListRouter = ({ tabBar, rid }) => {
	const username = useRouteParameter('context');
	const room = useRoom();
	const ownUserId = useUserId();
	const tab = useTab();

	const [currentRoute, params] = useCurrentRoute();
	const router = useRoute(currentRoute);

	const isMembersList = tab.id === 'members-list' || tab.id === 'user-info-group';

	const onClose = useMutableCallback(() => router.push({ ...params, tab: isMembersList ? tab.id : '', context: '' }));

	if (isMembersList && !username) {
		return <VerticalBarOldActions {...tab} name={'membersList'} template={'membersList'} tabBar={tabBar} rid={rid} _id={rid} />;
	}

	return <UserInfo width='100%' {...username ? { username } : { uid: room.uids.filter((uid) => uid !== ownUserId).shift() }} onClose={onClose} rid={rid}/>;
};

export default MemberListRouter;
