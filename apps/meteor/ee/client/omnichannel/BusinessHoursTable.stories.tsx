import { Box } from '@rocket.chat/fuselage';
import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import BusinessHoursTable from './BusinessHoursTable';

export default {
	title: 'Enterprise/Omnichannel/BusinessHoursTable',
	component: BusinessHoursTable,
	parameters: {
		actions: {
			argTypesRegex: '^on.*',
		},
	},
} as ComponentMeta<typeof BusinessHoursTable>;

export const Default: ComponentStory<typeof BusinessHoursTable> = (args) => <BusinessHoursTable {...args} />;
Default.storyName = 'BusinessHoursTable';
Default.args = {
	businessHours: [
		{
			name: '',
			timezone: { name: 'America/Sao_Paulo' },
			workHours: [
				{ day: 'Monday', open: true },
				{ day: 'Tuesday', open: true },
				{ day: 'Wednesday', open: true },
				{ day: 'Saturday', open: true },
			],
		},
		{
			name: 'Extra',
			timezone: { name: 'America/Sao_Paulo' },
			workHours: [
				{ day: 'Monday', open: true },
				{ day: 'Tuesday', open: true },
				{ day: 'Saturday', open: true },
			],
		},
		{
			name: 'Extra2',
			timezone: { name: 'America/Sao_Paulo' },
			workHours: [
				{ day: 'Saturday', open: true },
				{ day: 'Sunday', open: true },
				{ day: 'Monday', open: false },
			],
		},
		{
			name: 'Extra3',
			timezone: { name: 'America/Sao_Paulo' },
			workHours: [
				{ day: 'Monday', open: true },
				{ day: 'Saturday', open: true },
			],
		},
	],
	params: {},
};
Default.decorators = [
	(fn) => (
		<Box maxWidth='x600' alignSelf='center' w='full' m='x24'>
			{fn()}
		</Box>
	),
];
