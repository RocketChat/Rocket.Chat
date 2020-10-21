import React, { useMemo, FC } from 'react';

import { useSetting } from '../contexts/SettingsContext';
import { AvatarUrlContext } from '../contexts/AvatarUrlContext';
import { roomTypes } from '../../app/utils/client';

const AvatarUrlProvider: FC = ({ children }) => {
	const externalProviderUrl = String(useSetting('Accounts_AvatarExternalProviderUrl') || '');

	const contextValue = useMemo(() => ({
		getUserPathAvatar: externalProviderUrl
			? (uid: string): string => {
				const externalSource = externalProviderUrl.trim().replace(/\/+$/, '').replace('{username}', uid);
				return externalSource;
			} : (uid: string, etag?: string): string => `/avatar/${ uid }${ etag ? `?etag=${ etag }` : '' }`,
		getRoomPathAvatar: ({ type, ...room }: any): string => roomTypes.getConfig(type || room.t).getAvatarPath({ username: room._id, ...room }),
	}), [externalProviderUrl]);

	return <AvatarUrlContext.Provider children={children} value={contextValue} />;
};

export default AvatarUrlProvider;
