import { isTeamRoom } from '@rocket.chat/core-typings';
import { useRouter } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { useMemo } from 'react';

import type { RoomHeaderActions } from './RoomHeaderActionsContext';
import { RoomHeaderActionsContext } from './RoomHeaderActionsContext';
import { useGoToRoom } from '../hooks/useGoToRoom';
import { useToggleFavoriteMutation } from '../hooks/useToggleFavoriteMutation';

type RoomHeaderActionsProviderProps = {
	children?: ReactNode;
};

/** Carries out what the room header asks for: toggling the favorite, opening a room, pointing at the room's settings */
const RoomHeaderActionsProvider = ({ children }: RoomHeaderActionsProviderProps) => {
	const router = useRouter();
	const goToRoom = useGoToRoom();
	const { mutate: toggleFavorite } = useToggleFavoriteMutation();

	const value = useMemo(
		(): RoomHeaderActions => ({
			toggleFavorite: (room, favorite) => toggleFavorite({ roomId: room._id, favorite, roomName: room.name || '' }),
			openRoom: (rid) => goToRoom(rid),
			roomSettingsHref: (room) => `${router.getLocationPathname()}/${isTeamRoom(room) ? 'team-info' : 'channel-settings'}`,
		}),
		[goToRoom, router, toggleFavorite],
	);

	return <RoomHeaderActionsContext.Provider value={value}>{children}</RoomHeaderActionsContext.Provider>;
};

export default RoomHeaderActionsProvider;
