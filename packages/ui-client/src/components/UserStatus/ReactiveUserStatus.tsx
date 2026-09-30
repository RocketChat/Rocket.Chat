import type { IUser } from '@rocket.chat/core-typings';
import { useUserPresence } from '@rocket.chat/ui-contexts';
import type { ComponentProps } from 'react';
import { memo } from 'react';

import UserStatus from './UserStatus';

export type ReactiveUserStatusProps = {
	uid: IUser['_id'];
} & ComponentProps<typeof UserStatus>;

const ReactiveUserStatus = ({ uid, ...props }: ReactiveUserStatusProps) => {
	const status = useUserPresence(uid)?.status;
	return <UserStatus status={status} {...props} />;
};

export default memo(ReactiveUserStatus);
