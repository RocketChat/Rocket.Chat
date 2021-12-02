import React, { memo, ReactElement } from 'react';

import { IUser } from '../../../definition/IUser';
import { usePresence } from '../../hooks/usePresence';
import UserStatus from './UserStatus';

const ReactiveUserStatus = ({
	uid,
	...props
}: {
	uid: IUser['_id'];
	props: typeof UserStatus;
}): ReactElement => {
	const status = usePresence(uid)?.status;
	return <UserStatus status={status} {...props} />;
};

export default memo(ReactiveUserStatus);
