import type { IRoom } from '@rocket.chat/core-typings';
import { useUserPreference } from '@rocket.chat/ui-contexts';
import React, { ReactNode, useMemo } from 'react';

import RoomAvatar from '../../components/avatar/RoomAvatar';

export const useAvatarTemplate = (
	sidebarViewMode?: 'extended' | 'medium' | 'condensed',
	sidebarDisplayAvatar?: boolean,
): null | ((room: IRoom & { rid: string }) => ReactNode) => {
	const sidebarViewModeFromSettings = useUserPreference<'extended' | 'medium' | 'condensed'>('sidebarViewMode');
	const sidebarDisplayAvatarFromSettings = useUserPreference('sidebarDisplayAvatar');

	const viewMode = sidebarViewMode ?? sidebarViewModeFromSettings;
	const displayAvatar = sidebarDisplayAvatar ?? sidebarDisplayAvatarFromSettings;
	return useMemo(() => {
		if (!displayAvatar) {
			return null;
		}

		const size = ((): 'x36' | 'x28' | 'x16' => {
			switch (viewMode) {
				case 'extended':
					return 'x36';
				case 'medium':
					return 'x28';
				case 'condensed':
				default:
					return 'x16';
			}
		})();

		const renderRoomAvatar = (room: IRoom & { rid: string }): ReactNode => (
			<RoomAvatar size={size} room={{ ...room, _id: room.rid || room._id, type: room.t }} />
		);

		return renderRoomAvatar;
	}, [displayAvatar, viewMode]);
};
