import { Box } from '@rocket.chat/fuselage';
import { action } from '@storybook/addon-actions';
import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import CustomFieldsForm from './CustomFieldsForm';

export default {
	title: 'Omnichannel/CustomFieldsForm',
	component: CustomFieldsForm,
	decorators: [
		(fn) => (
			<Box maxWidth='x600' alignSelf='center' w='full' m='x24'>
				{fn()}
			</Box>
		),
	],
} as ComponentMeta<typeof CustomFieldsForm>;

export const Default: ComponentStory<typeof CustomFieldsForm> = (args) => <CustomFieldsForm {...args} />;
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
