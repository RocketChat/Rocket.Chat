import { useUserAvatarURL } from '@rocket.chat/ui-contexts';
import React, { ComponentProps, memo, ReactElement } from 'react';

import BaseAvatar from './BaseAvatar';

type UserAvatarFromContextProps = Omit<ComponentProps<typeof BaseAvatar>, 'url'> & {
	username: string;
};

const UserAvatarFromContext = ({ username, ...props }: UserAvatarFromContextProps): ReactElement => {
	const url = useUserAvatarURL(username);

	return <BaseAvatar url={url} data-username={username} title={username} {...props} />;
};

export default memo(UserAvatarFromContext);
