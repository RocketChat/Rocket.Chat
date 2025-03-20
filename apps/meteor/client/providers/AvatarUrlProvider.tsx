import { AvatarUrlContext } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { useMemo } from 'react';

import { getURL } from '../../app/utils/client/getURL';
import { roomCoordinator } from '../lib/rooms/roomCoordinator';

type AvatarUrlProviderProps = {
	children?: ReactNode;
};

const AvatarUrlProvider = ({ children }: AvatarUrlProviderProps) => {
	const contextValue = useMemo(() => {
		function getUserPathAvatar(username: string, etag?: string): string;
		function getUserPathAvatar({ userId, etag }: { userId: string; etag?: string }): string;
		function getUserPathAvatar({ username, etag }: { username: string; etag?: string }): string;
		function getUserPathAvatar(...args: any): string {
			if (typeof args[0] === 'string') {
				const [username, etag] = args;
				return getURL(`/avatar/${username}${etag ? `?etag=${etag}` : ''}`);
			}
			const [params] = args;
			if ('userId' in params) {
				const { userId, etag } = params;
				return getURL(`/avatar/uid/${userId}${etag ? `?etag=${etag}` : ''}`);
			}
			const { username, etag } = params;
			return getURL(`/avatar/${username}${etag ? `?etag=${etag}` : ''}`);
		}
		return {
			getUserPathAvatar,
			getRoomPathAvatar: ({ type, ...room }: any): string =>
				roomCoordinator.getRoomDirectives(type || room.t).getAvatarPath({ username: room._id, ...room }) || '',
		};
	}, []);

	return <AvatarUrlContext.Provider children={children} value={contextValue} />;
};

export default AvatarUrlProvider;
