import { Box } from '@rocket.chat/fuselage';
import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import BusinessHoursTimeZone from './BusinessHoursTimeZone';

export default {
	title: 'Enterprise/Omnichannel/BusinessHoursTimeZone',
	component: BusinessHoursTimeZone,
	decorators: [
		(fn) => (
			<Box maxWidth='x600' alignSelf='center' w='full' m='x24'>
				{fn()}
			</Box>
		),
	],
} as ComponentMeta<typeof BusinessHoursTimeZone>;

export const Default: ComponentStory<typeof BusinessHoursTimeZone> = (args) => <BusinessHoursTimeZone {...args} />;
Default.storyName = 'BusinessHoursTimeZone';
