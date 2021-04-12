import React, { FC } from 'react';

import { IMessage } from '../../../../../definition/IMessage';
import { IUser } from '../../../../../definition/IUser';
import UserAvatar from '../../../../components/avatar/UserAvatar';

export const Avatar: FC<{ message: IMessage; user: Pick<IUser, 'username'> }> = ({
	message,
	user,
}) => (
	<>
		{message.avatar}
		{message.emoji}
		{user.username && <UserAvatar username={user.username} size={'x36'} />}
	</>
);
