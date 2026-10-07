import { RoomAvatar } from '@rocket.chat/ui-avatar';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import type { ComponentType } from 'react';
import { useMemo } from 'react';

import type { SidebarAvatarSize } from './useSidebarDisplayPreferences';
import { useSidebarDisplayPreferences } from './useSidebarDisplayPreferences';
import { SIDEBAR_ITEM_AVATAR_SIZE } from '../Item/sidebarItemLayout';

export const useAvatarTemplate = (
	sidebarAvatarSize?: SidebarAvatarSize,
	sidebarDisplayAvatar?: boolean,
): null | ComponentType<SubscriptionWithRoom & { rid: string }> => {
	const preferences = useSidebarDisplayPreferences();

	const avatarSize = sidebarAvatarSize ?? preferences.avatarSize;
	const displayAvatar = sidebarDisplayAvatar ?? preferences.displayAvatar;
	return useMemo(() => {
		if (!displayAvatar) {
			return null;
		}

		const size = SIDEBAR_ITEM_AVATAR_SIZE[avatarSize];

		const renderRoomAvatar: ComponentType<SubscriptionWithRoom & { rid: string }> = (room) => (
			<RoomAvatar size={size} room={{ ...room, _id: room.rid || room._id, type: room.t }} />
		);

		return renderRoomAvatar;
	}, [displayAvatar, avatarSize]);
};
