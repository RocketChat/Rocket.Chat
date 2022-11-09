import type { IUser } from '@rocket.chat/core-typings';
import { UserStatus } from '@rocket.chat/ui-client';
import React, { ComponentProps, memo, ReactElement } from 'react';

import { usePresence } from '../../hooks/usePresence';

type ReactiveUserStatusProps = {
	uid: IUser['_id'];
} & ComponentProps<typeof UserStatus.UserStatus>;

const ReactiveUserStatus = ({ uid, ...props }: ReactiveUserStatusProps): ReactElement => {
	const status = usePresence(uid)?.status;
	return <UserStatus.UserStatus status={status} {...props} />;
};

export default memo(ReactiveUserStatus);
