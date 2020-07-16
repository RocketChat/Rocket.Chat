import { Margins } from '@rocket.chat/fuselage';
import React from 'react';

import { ChannelsTab } from '.';

export default {
	title: 'admin/enterprise/engagement/ChannelsTab',
	component: ChannelsTab,
	decorators: [
		(fn) => <Margins children={fn()} all='x24' />,
	],
};

export const _default = () => <ChannelsTab />;
