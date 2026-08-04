import type { StoryObj, Meta } from '@storybook/react';

import CounterContainer from './CounterContainer';

export default {
	component: CounterContainer,
} satisfies Meta<typeof CounterContainer>;

export const Default: StoryObj<typeof CounterContainer> = {
	name: 'CounterContainer',

	args: {
		totals: [
			{ title: 'Total_conversations', value: 10 },
			{ title: 'Open_conversations', value: 10 },
			{ title: 'Total_messages', value: 10 },
			{ title: 'Total_visitors', value: 0 },
		],
	},
};
