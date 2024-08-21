import { Field } from '@rocket.chat/fuselage';
import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import BooleanSettingInput from './BooleanSettingInput';

export default {
	title: 'Admin/Settings/Inputs/BooleanSettingInput',
	component: BooleanSettingInput,
	parameters: {
		actions: {
			argTypesRegex: '^on.*',
		},
	},
	decorators: [(fn) => <Field>{fn()}</Field>],
} as ComponentMeta<typeof BooleanSettingInput>;

const Template: ComponentStory<typeof BooleanSettingInput> = (args) => <BooleanSettingInput {...args} />;

export const Default = Template.bind({});
Default.args = {
	_id: 'setting_id',
	label: 'Label',
};

export const Disabled = Template.bind({});
Disabled.args = {
	_id: 'setting_id',
	label: 'Label',
	disabled: true,
};

export const Checked = Template.bind({});
Checked.args = {
	_id: 'setting_id',
	label: 'Label',
	value: true,
};

export const WithResetButton = Template.bind({});
WithResetButton.args = {
	_id: 'setting_id',
	label: 'Label',
	hasResetButton: true,
};
