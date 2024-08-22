import { Field } from '@rocket.chat/fuselage';
import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import PasswordSettingInput from './PasswordSettingInput';

export default {
	title: 'Admin/Settings/Inputs/PasswordSettingInput',
	component: PasswordSettingInput,
	parameters: {
		actions: {
			argTypesRegex: '^on.*',
		},
	},
	decorators: [(fn) => <Field>{fn()}</Field>],
} as ComponentMeta<typeof PasswordSettingInput>;

const Template: ComponentStory<typeof PasswordSettingInput> = (args) => <PasswordSettingInput {...args} />;

export const Default = Template.bind({});
Default.args = {
	_id: 'setting_id',
	label: 'Label',
	placeholder: 'Placeholder',
};

export const Disabled = Template.bind({});
Disabled.args = {
	_id: 'setting_id',
	label: 'Label',
	placeholder: 'Placeholder',
	disabled: true,
};

export const WithValue = Template.bind({});
WithValue.args = {
	_id: 'setting_id',
	label: 'Label',
	value: '5w0rdf15h',
	placeholder: 'Placeholder',
};

export const WithResetButton = Template.bind({});
WithValue.args = {
	_id: 'setting_id',
	label: 'Label',
	placeholder: 'Placeholder',
	hasResetButton: true,
};
