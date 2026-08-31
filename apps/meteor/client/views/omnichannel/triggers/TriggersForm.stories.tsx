import { FieldGroup, Box } from '@rocket.chat/fuselage';
import type { StoryObj, Meta } from '@storybook/react';

import EditTrigger from './EditTrigger';

export default {
	component: EditTrigger,
	decorators: [
		(fn) => (
			<Box maxWidth='x600'>
				<FieldGroup>{fn()}</FieldGroup>
			</Box>
		),
	],
} satisfies Meta<typeof EditTrigger>;

export const Default: StoryObj<typeof EditTrigger> = {};
