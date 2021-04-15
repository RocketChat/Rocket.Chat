import React, { memo } from 'react';

import { usePresence } from '../../hooks/usePresence';
import UserStatus from './UserStatus';

const ReactiveUserStatus = ({ uid, presence, ...props }) => {
	const status = usePresence(uid, presence);
	return <UserStatus status={status} {...props} />;
};

export default memo(ReactiveUserStatus);
