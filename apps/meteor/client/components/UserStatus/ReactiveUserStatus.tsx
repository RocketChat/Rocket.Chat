import type { IUser } from '@rocket.chat/core-typings';
import { UserStatus } from '@rocket.chat/ui-client';
import { useUserPresence } from '@rocket.chat/ui-contexts';
import type { ComponentProps } from 'react';
import { memo } from 'react';

type ReactiveUserStatusProps = {
	uid: IUser['_id'];
} & ComponentProps<typeof UserStatus.UserStatus>;

const ReactiveUserStatus = ({ uid, ...props }: ReactiveUserStatusProps) => {
	const status = useUserPresence(uid)?.status;
	return <UserStatus.UserStatus status={status} {...props} />;
};

export default memo(ReactiveUserStatus);
