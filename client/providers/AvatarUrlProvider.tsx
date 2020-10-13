import React, { FC, useMemo } from 'react';
import { Avatar } from '@rocket.chat/fuselage';

// import { baseURI } from '../../app/utils/client/lib/baseuri';

// const base = baseURI;

const AvatarUrlProvider: FC = ({ children }) => {
	const avatarBase = useMemo(() => ({ baseUrl: '' }), []);
	return <Avatar.Context.Provider children={children} value={avatarBase} />;
};

export default AvatarUrlProvider;
