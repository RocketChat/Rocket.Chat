import { Box, Skeleton } from '@rocket.chat/fuselage';
import type { Meta, StoryFn } from '@storybook/react';

import BusinessHoursMultiple from './BusinessHoursMultiple';

export default {
	title: 'Enterprise/Omnichannel/BusinessHoursMultiple',
	component: BusinessHoursMultiple,
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [
		(fn) => (
			<Box maxWidth='x600' alignSelf='center' w='full' m={24}>
				{fn()}
			</Box>
		),
	],
} satisfies Meta<typeof BusinessHoursMultiple>;

export const Default: StoryFn<typeof BusinessHoursMultiple> = (args) => <BusinessHoursMultiple {...args} />;
Default.storyName = 'BusinessHoursMultiple';
Default.args = {
	departmentList: [
		[1, 'Support'],
		[2, 'Marketing'],
		[3, <Skeleton width='x100' key={3} />],
	],
} as any;
