import { Box } from '@rocket.chat/fuselage';
import React from 'react';

import { useForm } from '../../../hooks/useForm';
import BusinessHoursForm from './BusinessHoursForm';

export default {
	title: 'omnichannel/businessHours',
	component: BusinessHoursForm,
};

export const Default = () => {
	const { values, handlers } = useForm({
		daysOpen: ['Monday', 'Tuesday', 'Saturday'],
		daysTime: {
			Monday: { start: '00:00', finish: '08:00' },
			Tuesday: { start: '00:00', finish: '08:00' },
			Saturday: { start: '00:00', finish: '08:00' },
		},
	});

	return (
		<Box maxWidth='x600' alignSelf='center' w='full' m='x24'>
			<BusinessHoursForm values={values} handlers={handlers} />
		</Box>
	);
};
