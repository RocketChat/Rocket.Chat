import { Field } from '@rocket.chat/fuselage';
import type { Meta, StoryFn } from '@storybook/react';

import ColorSettingInput from './ColorSettingInput';

export default {
	title: 'Admin/Settings/Inputs/ColorSettingInput',
	component: ColorSettingInput,
	parameters: {
		actions: {
			argTypesRegex: '^on.*',
		},
	},
	decorators: [(fn) => <Field>{fn()}</Field>],
} satisfies Meta<typeof ColorSettingInput>;

const Template: StoryFn<typeof ColorSettingInput> = (args) => <ColorSettingInput {...args} />;

export const Default = Template.bind({});
Default.args = {
	_id: 'setting_id',
	label: 'Label',
	editor: 'color',
	allowedTypes: ['color', 'expression'],
	placeholder: 'Placeholder',
};

export const Disabled = Template.bind({});
Disabled.args = {
	_id: 'setting_id',
	label: 'Label',
	editor: 'color',
	allowedTypes: ['color', 'expression'],
	placeholder: 'Placeholder',
	disabled: true,
};

export const WithValue = Template.bind({});
WithValue.args = {
	_id: 'setting_id',
	label: 'Label',
	editor: 'color',
	allowedTypes: ['color', 'expression'],
	value: '#db2323',
	placeholder: 'Placeholder',
};

export const WithExpressionAsValue = Template.bind({});
WithExpressionAsValue.args = {
	_id: 'setting_id',
	label: 'Label',
	editor: 'expression',
	allowedTypes: ['color', 'expression'],
	value: 'var(--rc-color-primary)',
	placeholder: 'Placeholder',
};

export const WithResetButton = Template.bind({});
WithResetButton.args = {
	_id: 'setting_id',
	label: 'Label',
	editor: 'color',
	allowedTypes: ['color', 'expression'],
	placeholder: 'Placeholder',
	hasResetButton: true,
};
