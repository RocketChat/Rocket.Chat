import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import CounterSet from './CounterSet';

export default {
	title: 'Components/Data/CounterSet',
	component: CounterSet,
	parameters: {
		layout: 'padded',
		controls: { hideNoControlsWarning: true },
	},
} as ComponentMeta<typeof CounterSet>;

export const Default: ComponentStory<typeof CounterSet> = (args) => <CounterSet {...args} />;
Default.storyName = 'CounterSet';
Default.args = {
	counters: [
		{ count: 123, variation: 0 },
		{ count: 456, variation: 7 },
		{ count: 789, variation: -1, description: 'Description' },
	],
};
