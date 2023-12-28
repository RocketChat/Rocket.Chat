import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import type { UIEvent } from 'react';
import { useCallback, useEffect } from 'react';

import { openUserCard, closeUserCard } from '../../../../../app/ui/client/lib/userCard';
import { useRoom } from '../../contexts/RoomContext';
import { useRoomToolbox } from '../../contexts/RoomToolboxContext';

export const useUserCard = () => {
	useEffect(() => {
		return () => {
			closeUserCard();
		};
	}, []);

	const room = useRoom();
	const { openTab } = useRoomToolbox();

	const openUserInfo = useMutableCallback((username?: string) => {
		switch (room.t) {
			case 'l':
				openTab('room-info', username);
				break;

			case 'v':
				openTab('voip-room-info', username);
				break;

			case 'd':
				(room.uids?.length ?? 0) > 2 ? openTab('user-info-group', username) : openTab('user-info', username);
				break;

			default:
				openTab('members-list', username);
				break;
		}
	});

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
