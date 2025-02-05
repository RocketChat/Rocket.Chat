import { Box } from '@rocket.chat/fuselage';
import type { Meta, StoryFn } from '@storybook/react';

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
} satisfies Meta<typeof BusinessHoursForm>;

export const Default: StoryFn<typeof BusinessHoursForm> = (args) => <BusinessHoursForm {...args} />;
Default.storyName = 'BusinessHoursForm';
