import { Margins } from '@rocket.chat/fuselage';
import React from 'react';

import { UsersTab } from '.';

export default {
	title: 'admin/enterprise/engagement/UsersTab',
	component: UsersTab,
	decorators: [
		(fn) => <Margins children={fn()} all='x24' />,
	],
};

export const _default = () => <UsersTab />;
