import type { IUser } from '@rocket.chat/core-typings';
import React, { memo, ReactElement } from 'react';

import { usePresence } from '../../hooks/usePresence';
import UserStatus, { UserStatusProps } from './UserStatus';

const ReactiveUserStatus = ({
	uid,
	...props
}: {
	uid: IUser['_id'];
} & UserStatusProps): ReactElement => {
	const status = usePresence(uid)?.status;
	return <UserStatus status={status} {...props} />;
};

export default memo(ReactiveUserStatus);
