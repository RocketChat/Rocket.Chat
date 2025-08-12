import { Field } from '@rocket.chat/fuselage';
import type { Meta, StoryFn } from '@storybook/react';

import FontSettingInput from './FontSettingInput';

export default {
	title: 'Admin/Settings/Inputs/FontSettingInput',
	component: FontSettingInput,
	parameters: {
		actions: {
			argTypesRegex: '^on.*',
		},
	},
	decorators: [(fn) => <Field>{fn()}</Field>],
} satisfies Meta<typeof FontSettingInput>;

const Template: StoryFn<typeof FontSettingInput> = (args) => <FontSettingInput {...args} />;

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
	value: 'Roboto',
};

export const WithResetButton = Template.bind({});
WithResetButton.args = {
	_id: 'setting_id',
	label: 'Label',
	placeholder: 'Placeholder',
	hasResetButton: true,
};
