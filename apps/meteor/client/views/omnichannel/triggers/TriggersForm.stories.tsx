import { FieldGroup, Box } from '@rocket.chat/fuselage';
import type { Meta, StoryFn } from '@storybook/react';

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
} satisfies Meta<typeof EditTrigger>;

export const Default: StoryFn<typeof EditTrigger> = (args) => <EditTrigger {...args} />;
