import { Margins } from '@rocket.chat/fuselage';
import React from 'react';

import { StreamGraph } from './StreamGraph';

export default {
	title: 'admin/engagement/data/StreamGraph',
	component: StreamGraph,
	decorators: [(fn) => <Margins all='x16' children={fn()} />],
};

export const _default = () => <StreamGraph
	lastDate={new Date()}
	series={{
		A: Array.from({ length: 21 }, () => Math.round(200 + 80 * Math.random())),
		B: Array.from({ length: 21 }, () => Math.round(220 + 80 * Math.random())),
		C: Array.from({ length: 21 }, () => Math.round(240 + 80 * Math.random())),
	}}
/>;
