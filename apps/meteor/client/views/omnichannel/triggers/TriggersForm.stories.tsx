import { FieldGroup, Box } from '@rocket.chat/fuselage';
import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import TriggersForm from './TriggersForm';

export default {
	title: 'Omnichannel/TriggersForm',
	component: TriggersForm,
	decorators: [
		(fn) => (
			<Box maxWidth='x600'>
				<FieldGroup>{fn()}</FieldGroup>
			</Box>
		),
	],
} as ComponentMeta<typeof TriggersForm>;

export const Default: ComponentStory<typeof TriggersForm> = (args) => <TriggersForm {...args} />;
Default.storyName = 'TriggersForm';
Default.args = {
	onSave: () => Promise.resolve(),
};
