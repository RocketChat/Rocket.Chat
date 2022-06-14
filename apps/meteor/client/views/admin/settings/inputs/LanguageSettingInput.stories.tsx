import { Field } from '@rocket.chat/fuselage';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import LanguageSettingInput from './LanguageSettingInput';

export default {
	title: 'Admin/Settings/Inputs/LanguageSettingInput',
	component: LanguageSettingInput,
	parameters: {
		actions: {
			argTypesRegex: '^on.*',
		},
	},
	decorators: [(fn) => <Field>{fn()}</Field>],
} as ComponentMeta<typeof LanguageSettingInput>;

const Template: ComponentStory<typeof LanguageSettingInput> = (args) => <LanguageSettingInput {...args} />;

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
	placeholder: 'Placeholder',
	value: 'en',
};

export const WithResetButton = Template.bind({});
WithResetButton.args = {
	_id: 'setting_id',
	label: 'Label',
	placeholder: 'Placeholder',
	value: ['1', '2', '3'],
	hasResetButton: true,
};
