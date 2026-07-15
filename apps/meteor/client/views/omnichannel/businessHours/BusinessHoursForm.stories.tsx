import { Box } from '@rocket.chat/fuselage';
import type { StoryObj, Meta } from '@storybook/react';

import BusinessHoursForm from './BusinessHoursForm';

export default {
	component: BusinessHoursForm,
	decorators: [
		(fn) => (
			<Box maxWidth='x600' alignSelf='center' w='full' m={24}>
				{fn()}
			</Box>
		),
	],
} satisfies Meta<typeof BusinessHoursForm>;

export const Default: StoryObj<typeof BusinessHoursForm> = {
	name: 'BusinessHoursForm',
};
