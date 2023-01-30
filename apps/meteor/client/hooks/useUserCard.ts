import type { UIEvent } from 'react';
import { useCallback, useEffect } from 'react';

import { openUserCard, closeUserCard } from '../../app/ui/client/lib/userCard';
import { useRoom } from '../views/room/contexts/RoomContext';
import { useTabBarOpenUserInfo } from '../views/room/contexts/ToolboxContext';

export const useUserCard = () => {
	useEffect(() => {
		return () => {
			closeUserCard();
		};
	}, []);

	const room = useRoom();
	const openUserInfo = useTabBarOpenUserInfo();

	const open = useCallback(
		(username: string) => (event: UIEvent) => {
			event.preventDefault();
			openUserCard({
				username,
				target: event.currentTarget,
				rid: room._id,
				open: (event: UIEvent) => {
					event.preventDefault();
					openUserInfo(username);
				},
			});
		},
		[openUserInfo, room._id],
	);

	return { open, close: closeUserCard };
};
