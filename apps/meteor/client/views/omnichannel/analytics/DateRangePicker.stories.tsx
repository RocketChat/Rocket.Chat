import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import DateRangePicker from './DateRangePicker';

export default {
	title: 'Omnichannel/DateRangePicker',
	component: DateRangePicker,
	parameters: {
		layout: 'centered',
		controls: { hideNoControlsWarning: true },
		actions: { argTypesRegex: '^on.*' },
	},
} as ComponentMeta<typeof DateRangePicker>;

export const Default: ComponentStory<typeof DateRangePicker> = (args) => <DateRangePicker {...args} />;
Default.storyName = 'DateRangePicker';
