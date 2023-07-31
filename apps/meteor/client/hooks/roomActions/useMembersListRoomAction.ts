import { usePermission } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { MemberListRouter } from '../../views/room';
import { useRoom } from '../../views/room/contexts/RoomContext';
import type { ToolboxActionConfig } from '../../views/room/lib/Toolbox';

export const useMembersListRoomAction = (): ToolboxActionConfig | undefined => {
	const room = useRoom();
	const broadcast = !!room.broadcast;
	const team = !!room.teamMain;
	const permittedToViewBroadcastMemberList = usePermission('view-broadcast-member-list', room._id);

	return useMemo(() => {
		if (broadcast && !permittedToViewBroadcastMemberList) {
			return undefined;
		}

		return {
			id: 'members-list',
			groups: ['channel', 'group', 'team'],
			title: team ? 'Teams_members' : 'Members',
			icon: 'members',
			template: MemberListRouter,
			order: 5,
		};
	}, [broadcast, permittedToViewBroadcastMemberList, team]);
};
