import { lazy, useMemo } from 'react';

import type { ToolboxActionConfig } from '../../views/room/lib/Toolbox';

const Info = lazy(() => import('../../views/room/contextualBar/Info'));

export const useChannelSettingsRoomAction = (): ToolboxActionConfig => {
	return useMemo(
		() => ({
			id: 'channel-settings',
			groups: ['channel', 'group'],
			anonymous: true,
			full: true,
			title: 'Room_Info',
			icon: 'info-circled',
			template: Info,
			order: 1,
		}),
		[],
	);
};
