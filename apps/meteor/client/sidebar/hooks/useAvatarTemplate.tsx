import { RoomAvatar } from '@rocket.chat/ui-avatar';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useUserPreference } from '@rocket.chat/ui-contexts';
import type { ComponentType } from 'react';
import { useMemo } from 'react';

export const useAvatarTemplate = (sidebarDisplayAvatar?: boolean): null | ComponentType<SubscriptionWithRoom & { rid: string }> => {
	const sidebarDisplayAvatarFromSettings = useUserPreference('sidebarDisplayAvatar');

	const displayAvatar = sidebarDisplayAvatar ?? sidebarDisplayAvatarFromSettings;
	return useMemo(() => {
		if (!displayAvatar) {
			return null;
		}

		const renderRoomAvatar: ComponentType<SubscriptionWithRoom & { rid: string }> = (room) => (
			<RoomAvatar size='x20' room={{ ...room, _id: room.rid || room._id, type: room.t }} />
		);

		return renderRoomAvatar;
	}, [displayAvatar]);
};
