import { FieldGroup, Box } from '@rocket.chat/fuselage';
import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import EditTrigger from './EditTrigger';

export default {
	title: 'Omnichannel/EditTrigger',
	component: EditTrigger,
	decorators: [
		(fn) => (
			<Box maxWidth='x600'>
				<FieldGroup>{fn()}</FieldGroup>
			</Box>
		),
	],
} as ComponentMeta<typeof EditTrigger>;

export const Default: ComponentStory<typeof EditTrigger> = (args) => <EditTrigger {...args} />;
