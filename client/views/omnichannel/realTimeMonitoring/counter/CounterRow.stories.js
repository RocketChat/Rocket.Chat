import React from 'react';

import CounterItem from './CounterItem';
import CounterRow from './CounterRow';

export default {
	title: 'omnichannel/RealtimeMonitoring/Counter',
	component: CounterRow,
};

export const Default = () => (
	<CounterRow>
		<CounterItem title='total conversations' count={10} />
		<CounterItem title='open conversations' count={10} />
		<CounterItem title='total messages' count={10} />
		<CounterItem title='total visitors' />
	</CounterRow>
);
