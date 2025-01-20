import type { Meta, StoryFn } from '@storybook/react';

import CounterContainer from './CounterContainer';

export default {
	title: 'Omnichannel/Realtime Monitoring/CounterContainer',
	component: CounterContainer,
} satisfies Meta<typeof CounterContainer>;

export const Default: StoryFn<typeof CounterContainer> = (args) => <CounterContainer {...args} />;
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
