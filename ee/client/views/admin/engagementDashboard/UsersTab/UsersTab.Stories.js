import { Margins } from '@rocket.chat/fuselage';
import React from 'react';

import UsersTab from '.';

export default {
	title: 'admin/engagementDashboard/UsersTab',
	component: UsersTab,
	decorators: [(fn) => <Margins children={fn()} all='x24' />],
};

export const _default = () => <UsersTab />;
