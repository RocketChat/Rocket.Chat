import React from 'react';

import * as UserStatus from '.';

export default {
	title: 'components/UserStatus',
	component: UserStatus,
};

export const Online = () => <UserStatus.Online />;
export const Away = () => <UserStatus.Away />;
export const Busy = () => <UserStatus.Busy />;
export const Offline = () => <UserStatus.Offline />;
