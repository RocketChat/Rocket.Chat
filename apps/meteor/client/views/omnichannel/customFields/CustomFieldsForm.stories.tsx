import { Box } from '@rocket.chat/fuselage';
import { action } from '@storybook/addon-actions';
import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import NewCustomFieldsForm from './NewCustomFieldsForm';

export default {
	title: 'Omnichannel/NewCustomFieldsForm',
	component: NewCustomFieldsForm,
	decorators: [
		(fn) => (
			<Box maxWidth='x600' alignSelf='center' w='full' m={24}>
				{fn()}
			</Box>
		),
	],
} as ComponentMeta<typeof NewCustomFieldsForm>;

export const Default: ComponentStory<typeof NewCustomFieldsForm> = (args) => <NewCustomFieldsForm {...args} />;
Default.storyName = 'CustomFieldsForm';
Default.args = {
	values: {
		field: '',
		label: '',
		scope: 'visitor',
		visibility: true,
		regexp: '',
	},
	handlers: {
		handleField: action('handleField'),
		handleLabel: action('handleLabel'),
		handleScope: action('handleScope'),
		handleVisibility: action('handleVisibility'),
		handleRegexp: action('handleRegexp'),
	},
};
