import { Box } from '@rocket.chat/fuselage';
import type { StoryObj, Meta } from '@storybook/react';

import EditCustomFields from './EditCustomFields';

export default {
	component: EditCustomFields,
	decorators: [
		(fn) => (
			<Box maxWidth='x600' alignSelf='center' w='full' m={24}>
				{fn()}
			</Box>
		),
	],
} satisfies Meta<typeof EditCustomFields>;

export const Default: StoryObj<typeof EditCustomFields> = {
	name: 'CustomFieldsForm',
};
