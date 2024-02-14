import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import type { ComponentProps, ReactNode } from 'react';
import React, { Suspense, lazy, useCallback, useMemo, useState } from 'react';

import { useRoom } from '../contexts/RoomContext';
import { useRoomToolbox } from '../contexts/RoomToolboxContext';
import { UserCardContext } from '../contexts/UserCardContext';

const UserCard = lazy(() => import('../UserCard'));

const UserCardProvider = ({ children }: { children: ReactNode }) => {
	const room = useRoom();
	const [userCardData, setUserCardData] = useState<ComponentProps<typeof UserCard> | null>(null);

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

	const handleSetUserCard = useCallback(
		(e, username) => {
			setUserCardData({
				username,
				rid: room._id,
				target: e.target,
				onOpenUserInfo: () => openUserInfo(username),
				onClose: () => setUserCardData(null),
			});
		},
		[openUserInfo, room._id],
	);

	const contextValue = useMemo(
		() => ({
			openUserCard: handleSetUserCard,
			closeUserCard: () => setUserCardData(null),
		}),
		[handleSetUserCard],
	);

	return (
		<UserCardContext.Provider value={contextValue}>
			{children}
			{userCardData && (
				<Suspense fallback={null}>
					<UserCard {...userCardData} />
				</Suspense>
			)}
		</UserCardContext.Provider>
	);
};

export default UserCardProvider;
