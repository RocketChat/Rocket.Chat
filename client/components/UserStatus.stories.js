import React from 'react';

import * as Status from './UserStatus';

export default {
	title: 'components/UserStatus',
	component: Status,
};


export const Online = () => <Status.Online />;
export const Away = () => <Status.Away />;
export const Busy = () => <Status.Busy />;
export const Offline = () => <Status.Offline />;
