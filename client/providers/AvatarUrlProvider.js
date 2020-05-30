import React, { useMemo } from 'react';
import { Avatar } from '@rocket.chat/fuselage';

// import { baseURI } from '../../app/utils/client/lib/baseuri';

// const base = baseURI;

export function AvatarUrlProvider({ children }) {
	const avatarBase = useMemo(() => ({ baseUrl: '' }), []);
	return <Avatar.Context.Provider children={children} value={avatarBase} />;
}
