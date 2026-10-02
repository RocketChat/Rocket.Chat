import { AvatarUrlContext } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';

import { getURL } from '../lib/getURL';
import { roomCoordinator } from '../lib/rooms/roomCoordinator';

export type AvatarUrlProviderProps = {
	children?: ReactNode;
};

function getUserPathAvatar(username: string, etag?: string | null): string;
function getUserPathAvatar({ userId, etag }: { userId: string; etag?: string | null }): string;
function getUserPathAvatar({ username, etag }: { username: string; etag?: string | null }): string;
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

const contextValue = {
	getUserPathAvatar,
	getRoomPathAvatar: ({ type, ...room }: any): string =>
		roomCoordinator.getRoomDirectives(type || room.t).getAvatarPath({ username: room._id, ...room }) || '',
};

const AvatarUrlProvider = ({ children }: AvatarUrlProviderProps) => (
	<AvatarUrlContext.Provider value={contextValue}>{children}</AvatarUrlContext.Provider>
);

export default AvatarUrlProvider;
