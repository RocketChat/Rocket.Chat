import { Box } from '@rocket.chat/fuselage';
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
