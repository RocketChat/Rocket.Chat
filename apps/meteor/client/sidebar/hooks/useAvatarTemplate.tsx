import type { IRoom } from '@rocket.chat/core-typings';
import { RoomAvatar } from '@rocket.chat/ui-avatar';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useUserPreference } from '@rocket.chat/ui-contexts';
import type { ComponentType } from 'react';
import { useMemo } from 'react';

const isSubscriptionWithRoom = (room: SubscriptionWithRoom | IRoom): room is SubscriptionWithRoom => 'rid' in room;

export const useAvatarTemplate = (
	sidebarViewMode?: 'extended' | 'medium' | 'condensed',
	sidebarDisplayAvatar?: boolean,
): ComponentType<SubscriptionWithRoom | IRoom> | null => {
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

		const renderRoomAvatar: ComponentType<SubscriptionWithRoom | IRoom> = (room) => {
			const roomId = isSubscriptionWithRoom(room) ? room.rid : room._id;
			return <RoomAvatar size={size} room={{ ...room, _id: roomId, type: room.t }} />;
		};

		return renderRoomAvatar;
	}, [displayAvatar, viewMode]);
};
