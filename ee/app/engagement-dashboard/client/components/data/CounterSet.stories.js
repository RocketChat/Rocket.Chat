import React from 'react';

import { CounterSet } from './CounterSet';

export default {
	title: 'admin/enterprise/engagement/data/CounterSet',
	component: CounterSet,
};

export const _default = () => <CounterSet
	counters={[
		{ count: 123, variation: 0 },
		{ count: 456, variation: 7 },
		{ count: 789, variation: -1, description: 'Description' },
	]}
/>;
