import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import CounterContainer from './CounterContainer';

export default {
	title: 'Omnichannel/Realtime Monitoring/CounterContainer',
	component: CounterContainer,
} as ComponentMeta<typeof CounterContainer>;

export const Default: ComponentStory<typeof CounterContainer> = (args) => <CounterContainer {...args} />;
Default.storyName = 'CounterContainer';
Default.args = {
	initialData: [
		{ title: 'Total_conversations', value: 10 },
		{ title: 'Open_conversations', value: 10 },
		{ title: 'Total_messages', value: 10 },
		{ title: 'Total_visitors', value: 0 },
	],
	data: { totalizers: [] },
};
