import { RoomAvatar } from '@rocket.chat/ui-avatar';
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

		const size = ((): 'x36' | 'x28' | 'x20' => {
			switch (viewMode) {
				case 'extended':
					return 'x36';
				case 'medium':
					return 'x28';
				case 'condensed':
				default:
					return 'x20';
			}
		})();

		const renderRoomAvatar: ComponentType<SubscriptionWithRoom & { rid: string }> = (room) => (
			<RoomAvatar size={size} room={{ ...room, _id: room.rid || room._id, type: room.t }} />
		);

		return renderRoomAvatar;
	}, [displayAvatar, viewMode]);
};
