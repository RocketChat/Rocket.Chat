import React, { FC, memo } from 'react';

import { usePresence } from '../hooks/usePresence';
import UserStatus from './UserStatus';

type ReactiveUserStatusProps = any;

const ReactiveUserStatus: FC<ReactiveUserStatusProps> = ({ uid, presence, ...props }) => {
	const status = usePresence(uid, presence);
	return <UserStatus status={status} {...props} />;
};

export default memo(ReactiveUserStatus);
