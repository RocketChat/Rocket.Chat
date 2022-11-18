import { ComponentMeta, ComponentStory } from '@storybook/react';
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
		{ title: 'total conversations', value: 10 },
		{ title: 'open conversations', value: 10 },
		{ title: 'total messages', value: 10 },
		{ title: 'total visitors' },
	],
	data: [],
};
