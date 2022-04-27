import type { IMessage, IUser } from '@rocket.chat/core-typings';
import React, { FC } from 'react';

import UserAvatar from '../../../../components/avatar/UserAvatar';

export const Avatar: FC<{ message: IMessage; user: Pick<IUser, 'username'> }> = ({ message, user }) => (
	<>
		{message.avatar}
		{message.emoji}
		{user.username && <UserAvatar username={user.username} size={'x36'} />}
	</>
);
