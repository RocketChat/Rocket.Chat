import { Margins } from '@rocket.chat/fuselage';
import React from 'react';

import { MessagesTab } from '.';

export default {
	title: 'admin/enterprise/engagement/MessagesTab',
	component: MessagesTab,
	decorators: [
		(fn) => <Margins children={fn()} all='x24' />,
	],
};

export const _default = () => <MessagesTab />;
