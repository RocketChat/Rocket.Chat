import { FieldGroup, Box } from '@rocket.chat/fuselage';
import { action } from '@storybook/addon-actions';
import { ComponentMeta, ComponentStory } from '@storybook/react';
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
	values: {
		name: '',
		description: '',
		enabled: true,
		runOnce: false,
		conditions: {
			name: 'page-url',
			value: '',
		},
		actions: {
			name: '',
			params: {
				sender: 'queue',
				msg: '',
				name: '',
			},
		},
	},
	handlers: {
		handleName: action('handleName'),
		handleDescription: action('handleDescription'),
		handleEnabled: action('handleEnabled'),
		handleRunOnce: action('handleRunOnce'),
		handleConditions: action('handleConditions'),
		handleActions: action('handleActions'),
	},
};
