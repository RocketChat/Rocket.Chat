import React, { memo } from 'react';

import { usePresence } from '../../hooks/usePresence';
import UserStatus from './UserStatus';

const ReactiveUserStatus = ({ uid, ...props }) => {
	const status = usePresence(uid)?.status;
	return <UserStatus status={status} {...props} />;
};

export default memo(ReactiveUserStatus);
