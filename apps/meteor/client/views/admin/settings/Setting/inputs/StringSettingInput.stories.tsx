import { Field } from '@rocket.chat/fuselage';
import type { Meta, StoryFn } from '@storybook/react';

import StringSettingInput from './StringSettingInput';

export default {
	title: 'Admin/Settings/Inputs/StringSettingInput',
	component: StringSettingInput,
	parameters: {
		actions: {
			argTypesRegex: '^on.*',
		},
	},
	decorators: [(fn) => <Field>{fn()}</Field>],
} satisfies Meta<typeof StringSettingInput>;

const Template: StoryFn<typeof StringSettingInput> = (args) => <StringSettingInput {...args} />;

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
	value: 'Value',
	placeholder: 'Placeholder',
};

export const Multiline = Template.bind({});
Multiline.args = {
	_id: 'setting_id',
	label: 'Label',
	value: 'Value\n'.repeat(10),
	placeholder: 'Placeholder',
	multiline: true,
};

export const WithResetButton = Template.bind({});
WithResetButton.args = {
	_id: 'setting_id',
	label: 'Label',
	placeholder: 'Placeholder',
	hasResetButton: true,
};
