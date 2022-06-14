import { AvatarUrlContext, useSetting } from '@rocket.chat/ui-contexts';
import React, { useMemo, useEffect, useState, FC } from 'react';

import { getURL } from '../../app/utils/lib/getURL';
import { AvatarPathData } from '../../definition/IRoomTypeConfig';
import { roomCoordinator } from '../lib/rooms/roomCoordinator';

const AvatarUrlProvider: FC = ({ children }) => {
	const cdnAvatarUrl = String(useSetting('CDN_PREFIX') || '');
	const externalProviderUrl = String(useSetting('Accounts_AvatarExternalProviderUrl') || '');
	const [roomAvatarPath, setRoomAvatarPath] = useState('');
	const [type, setType] = useState('');
	const [room, setRoom] = useState<AvatarPathData>({ _id: '' });

	useEffect(() => {
		async function fetchRoomAvatarPath(): Promise<void> {
			const res = (await roomCoordinator.getRoomDirectives(type)?.getAvatarPath({ username: room._id, ...room })) || '';
			setRoomAvatarPath(res);
		}
		fetchRoomAvatarPath();
	}, [room, type]);
	const contextValue = useMemo(
		() => ({
			getUserPathAvatar: ((): ((uid: string, etag?: string) => string) => {
				if (externalProviderUrl) {
					return (uid: string): string => externalProviderUrl.trim().replace(/\/+$/, '').replace('{username}', uid);
				}
				if (cdnAvatarUrl) {
					return (uid: string, etag?: string): string => `${cdnAvatarUrl}/avatar/${uid}${etag ? `?etag=${etag}` : ''}`;
				}
				return (uid: string, etag?: string): string => getURL(`/avatar/${uid}${etag ? `?etag=${etag}` : ''}`);
			})(),
			getRoomPathAvatar: ({ type, ...room }: any): string => {
				setType(type || room.t);
				setRoom(room);
				return roomAvatarPath;
			},
		}),
		[externalProviderUrl, cdnAvatarUrl, roomAvatarPath],
	);

	return <AvatarUrlContext.Provider children={children} value={contextValue} />;
};

export default AvatarUrlProvider;
