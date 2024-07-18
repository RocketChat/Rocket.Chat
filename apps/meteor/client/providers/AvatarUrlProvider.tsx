import { AvatarUrlContext, useSetting } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import React, { useMemo } from 'react';

import { getURL } from '../../app/utils/client/getURL';
import { roomCoordinator } from '../lib/rooms/roomCoordinator';

type AvatarUrlProviderProps = {
	children?: ReactNode;
};

const AvatarUrlProvider = ({ children }: AvatarUrlProviderProps) => {
	const cdnAvatarUrl = String(useSetting('CDN_PREFIX') || '');
	const externalProviderUrl = String(useSetting('Accounts_AvatarExternalProviderUrl') || '');
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
			getRoomPathAvatar: ({ type, ...room }: any): string =>
				roomCoordinator.getRoomDirectives(type || room.t).getAvatarPath({ username: room._id, ...room }) || '',
		}),
		[externalProviderUrl, cdnAvatarUrl],
	);

	return <AvatarUrlContext.Provider children={children} value={contextValue} />;
};

export default AvatarUrlProvider;
