import React from 'react';
import { Box, Skeleton } from '@rocket.chat/fuselage';

import { BusinessHoursMultiple } from './BusinessHoursMultiple';

export default {
	title: 'omnichannel/businessHours/ee/BusinessHoursMultiple',
	component: BusinessHoursMultiple,
};

const departmentList = [
	[1, 'Support'],
	[2, 'Marketing'],
	[3, <Skeleton width='x100'/>],
];

export const Default = () => <Box maxWidth='x600' alignSelf='center' w='full' m='x24'>
	<BusinessHoursMultiple departmentList={departmentList}/>
</Box>;
