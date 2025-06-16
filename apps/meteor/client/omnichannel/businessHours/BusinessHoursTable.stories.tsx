import { Box } from '@rocket.chat/fuselage';
import type { Meta, StoryFn } from '@storybook/react';

import BusinessHoursTable from './BusinessHoursTable';

export default {
	title: 'Enterprise/Omnichannel/BusinessHoursTable',
	component: BusinessHoursTable,
	parameters: {
		actions: {
			argTypesRegex: '^on.*',
		},
	},
} satisfies Meta<typeof BusinessHoursTable>;

export const Default: StoryFn<typeof BusinessHoursTable> = (_args) => <BusinessHoursTable />;
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
		<Box maxWidth='x600' alignSelf='center' w='full' m={24}>
			{fn()}
		</Box>
	),
];
