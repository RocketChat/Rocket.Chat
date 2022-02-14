import { Box } from '@rocket.chat/fuselage';
import React from 'react';

import BusinessHoursTable from './BusinessHoursTable';

export default {
	title: 'omnichannel/businessHours/BusinessHoursTable',
	component: BusinessHoursTable,
};

const businessHours = [
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
];

export const Default = () => (
	<Box maxWidth='x600' alignSelf='center' w='full' m='x24'>
		<BusinessHoursTable businessHours={businessHours} businessHoursTotal={businessHours.length} params={{}} onChangeParams={() => {}} />
	</Box>
);
