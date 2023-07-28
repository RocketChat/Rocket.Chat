import { useMemo } from 'react';

import { MemberListRouter } from '../../views/room';
import type { ToolboxActionConfig } from '../../views/room/lib/Toolbox';

export const useUserInfoRoomAction = (): ToolboxActionConfig => {
	return useMemo(
		() => ({
			id: 'user-info',
			groups: ['direct'],
			title: 'User_Info',
			icon: 'user',
			template: MemberListRouter,
			order: 1,
		}),
		[],
	);
};
