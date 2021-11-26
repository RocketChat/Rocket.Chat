import { Box } from '@rocket.chat/fuselage';
import React from 'react';

import BusinessHoursTimeZone from './BusinessHoursTimeZone';

export default {
	title: 'omnichannel/businessHours/BusinessHoursTimeZone',
	component: BusinessHoursTimeZone,
};

export const Default = () => (
	<Box maxWidth='x600' alignSelf='center' w='full' m='x24'>
		<BusinessHoursTimeZone />
	</Box>
);
