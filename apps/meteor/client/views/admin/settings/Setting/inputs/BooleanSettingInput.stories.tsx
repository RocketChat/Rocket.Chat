import { Field } from '@rocket.chat/fuselage';
import type { Meta, StoryFn } from '@storybook/react';

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
} satisfies Meta<typeof BooleanSettingInput>;

const Template: StoryFn<typeof BooleanSettingInput> = (args) => <BooleanSettingInput {...args} />;

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
