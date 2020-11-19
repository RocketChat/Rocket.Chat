import React from 'react';

import CounterRow from './CounterRow';
import CounterItem from './CounterItem';

export default {
	title: 'omnichannel/RealtimeMonitoring/Counter',
	component: CounterRow,
};

export const Default = () => <CounterRow>
	<CounterItem title='total conversations' count={10}/>
	<CounterItem title='open conversations' count={10}/>
	<CounterItem title='total messages' count={10}/>
	<CounterItem title='total visitors'/>
</CounterRow>;
