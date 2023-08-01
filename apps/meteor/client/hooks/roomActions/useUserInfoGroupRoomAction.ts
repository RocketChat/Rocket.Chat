import { useMemo } from 'react';

import { MemberListRouter } from '../../views/room';
import type { ToolboxActionConfig } from '../../views/room/lib/Toolbox';

export const useUserInfoGroupRoomAction = (): ToolboxActionConfig => {
	return useMemo(
		() => ({
			id: 'user-info-group',
			groups: ['direct_multiple'],
			title: 'Members',
			icon: 'members',
			template: MemberListRouter,
			order: 1,
		}),
		[],
	);
};
