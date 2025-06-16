import { Box } from '@rocket.chat/fuselage';
import type { Meta, StoryFn } from '@storybook/react';

import EditCustomFields from './EditCustomFields';

export default {
	title: 'Omnichannel/CustomFields',
	component: EditCustomFields,
	decorators: [
		(fn) => (
			<Box maxWidth='x600' alignSelf='center' w='full' m={24}>
				{fn()}
			</Box>
		),
	],
} satisfies Meta<typeof EditCustomFields>;

export const Default: StoryFn<typeof EditCustomFields> = (args) => <EditCustomFields {...args} />;
Default.storyName = 'CustomFieldsForm';
