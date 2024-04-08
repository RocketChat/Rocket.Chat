import { Box } from '@rocket.chat/fuselage';
import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

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
} as ComponentMeta<typeof EditCustomFields>;

export const Default: ComponentStory<typeof EditCustomFields> = (args) => <EditCustomFields {...args} />;
Default.storyName = 'CustomFieldsForm';
