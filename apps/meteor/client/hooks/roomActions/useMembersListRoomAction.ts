import { usePermission } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { ui } from '../../lib/ui';
import { MemberListRouter } from '../../views/room';
import { useRoom } from '../../views/room/contexts/RoomContext';

export const useMembersListRoomAction = () => {
	const room = useRoom();
	const broadcast = !!room.broadcast;
	const team = !!room.teamMain;
	const permittedToViewBroadcastMemberList = usePermission('view-broadcast-member-list', room._id);

	useEffect(() => {
		if (broadcast && !permittedToViewBroadcastMemberList) {
			return;
		}

		return ui.addRoomAction('members-list', {
			groups: ['channel', 'group', 'team'],
			id: 'members-list',
			title: team ? 'Teams_members' : 'Members',
			icon: 'members',
			template: MemberListRouter,
			order: 5,
		});
	}, [broadcast, permittedToViewBroadcastMemberList, team]);
};
