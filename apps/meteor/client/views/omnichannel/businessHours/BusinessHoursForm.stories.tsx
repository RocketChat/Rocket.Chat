import { Box } from '@rocket.chat/fuselage';
import { action } from '@storybook/addon-actions';
import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import BusinessHoursForm from './BusinessHoursForm';

export default {
	title: 'Omnichannel/BusinessHoursForm',
	component: BusinessHoursForm,
	decorators: [
		(fn) => (
			<Box maxWidth='x600' alignSelf='center' w='full' m={24}>
				{fn()}
			</Box>
		),
	],
} as ComponentMeta<typeof BusinessHoursForm>;

export const Default: ComponentStory<typeof BusinessHoursForm> = (args) => <BusinessHoursForm {...args} />;
Default.storyName = 'BusinessHoursForm';
Default.args = {
	values: {
		daysOpen: ['Monday', 'Tuesday', 'Saturday'],
		daysTime: {
			Monday: { start: '00:00', finish: '08:00' },
			Tuesday: { start: '00:00', finish: '08:00' },
			Saturday: { start: '00:00', finish: '08:00' },
		},
	},
	handlers: {
		handleDaysOpen: action('handleDaysOpen'),
		handleDaysTime: action('handleDaysTime'),
	},
};
