import { ITEM_MEDIA_SIZE, RoomAvatar } from '@rocket.chat/ui-avatar';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useUserPreference } from '@rocket.chat/ui-contexts';
import type { ComponentType } from 'react';
import { useMemo } from 'react';

export const useAvatarTemplate = (
	sidebarViewMode?: 'extended' | 'medium' | 'condensed',
	sidebarDisplayAvatar?: boolean,
): null | ComponentType<SubscriptionWithRoom & { rid: string }> => {
	const sidebarViewModeFromSettings = useUserPreference<'extended' | 'medium' | 'condensed'>('sidebarViewMode');
	const sidebarDisplayAvatarFromSettings = useUserPreference('sidebarDisplayAvatar');

	const viewMode = sidebarViewMode ?? sidebarViewModeFromSettings;
	const displayAvatar = sidebarDisplayAvatar ?? sidebarDisplayAvatarFromSettings;
	return useMemo(() => {
		if (!displayAvatar) {
			return null;
		}

		const size = viewMode ? ITEM_MEDIA_SIZE[viewMode] : ITEM_MEDIA_SIZE.condensed;

		const renderRoomAvatar: ComponentType<SubscriptionWithRoom & { rid: string }> = (room) => (
			<RoomAvatar size={size} room={{ ...room, _id: room.rid || room._id, type: room.t }} />
		);

		return renderRoomAvatar;
	}, [displayAvatar, viewMode]);
};
