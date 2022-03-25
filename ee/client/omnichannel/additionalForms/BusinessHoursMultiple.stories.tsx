import { Box, Skeleton } from '@rocket.chat/fuselage';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import BusinessHoursMultiple from './BusinessHoursMultiple';

export default {
	title: 'Enterprise/Omnichannel/BusinessHoursMultiple',
	component: BusinessHoursMultiple,
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [
		(fn) => (
			<Box maxWidth='x600' alignSelf='center' w='full' m='x24'>
				{fn()}
			</Box>
		),
	],
} as ComponentMeta<typeof BusinessHoursMultiple>;

export const Default: ComponentStory<typeof BusinessHoursMultiple> = (args) => <BusinessHoursMultiple {...args} />;
Default.storyName = 'BusinessHoursMultiple';
Default.args = {
	departmentList: [
		[1, 'Support'],
		[2, 'Marketing'],
		[3, <Skeleton width='x100' />],
	],
} as any;
