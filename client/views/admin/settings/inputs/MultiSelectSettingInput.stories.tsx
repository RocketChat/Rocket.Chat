import { Field } from '@rocket.chat/fuselage';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import MultiSelectSettingInput from './MultiSelectSettingInput';

export default {
	title: 'Admin/Settings/Inputs/MultiSelectSettingInput',
	component: MultiSelectSettingInput,
	parameters: {
		actions: {
			argTypesRegex: '^on.*',
		},
	},
	decorators: [(fn) => <Field>{fn()}</Field>],
} as ComponentMeta<typeof MultiSelectSettingInput>;

const Template: ComponentStory<typeof MultiSelectSettingInput> = (args) => <MultiSelectSettingInput {...args} />;

const options = [
	{ key: '1', i18nLabel: '1' },
	{ key: '2', i18nLabel: '2' },
	{ key: '3', i18nLabel: '3' },
];

export const Default = Template.bind({});
Default.args = {
	_id: 'setting_id',
	label: 'Label',
	placeholder: 'Placeholder',
	values: options,
};

export const Disabled = Template.bind({});
Disabled.args = {
	_id: 'setting_id',
	label: 'Label',
	placeholder: 'Placeholder',
	values: options,
	disabled: true,
};

export const WithValue = Template.bind({});
WithValue.args = {
	_id: 'setting_id',
	label: 'Label',
	placeholder: 'Placeholder',
	value: [
		[1, 'Lorem Ipsum'],
		[2, 'Lorem Ipsum'],
	],
};

export const WithResetButton = Template.bind({});
WithResetButton.args = {
	_id: 'setting_id',
	label: 'Label',
	placeholder: 'Placeholder',
	values: options,
	hasResetButton: true,
};
