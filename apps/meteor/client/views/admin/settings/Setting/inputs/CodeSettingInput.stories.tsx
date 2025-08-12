import { Field } from '@rocket.chat/fuselage';
import type { Meta, StoryFn } from '@storybook/react';

import CodeSettingInput from './CodeSettingInput';

export default {
	title: 'Admin/Settings/Inputs/CodeSettingInput',
	component: CodeSettingInput,
	parameters: {
		actions: {
			argTypesRegex: '^on.*',
		},
	},
	decorators: [
		(fn) => (
			<div>
				<Field>{fn()}</Field>
			</div>
		),
	],
} satisfies Meta<typeof CodeSettingInput>;

const Template: StoryFn<typeof CodeSettingInput> = (args) => <CodeSettingInput {...args} />;

export const Default = Template.bind({});
Default.args = {
	_id: 'setting_id',
	label: 'Label',
	code: 'javascript',
	placeholder: 'Placeholder',
};

export const Disabled = Template.bind({});
Disabled.args = {
	_id: 'setting_id',
	label: 'Label',
	code: 'javascript',
	placeholder: 'Placeholder',
	disabled: true,
};

export const WithValue = Template.bind({});
WithValue.args = {
	_id: 'setting_id',
	label: 'Label',
	value: 'console.log("Hello World!");',
	placeholder: 'Placeholder',
};

export const WithDescription = Template.bind({});
WithDescription.args = {
	_id: 'setting_id',
	label: 'Label',
	hint: 'Description: Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
	value: 'console.log("Hello World!");',
	placeholder: 'Placeholder',
};

export const WithResetButton = Template.bind({});
WithResetButton.args = {
	_id: 'setting_id',
	label: 'Label',
	value: 'console.log("Hello World!");',
	placeholder: 'Placeholder',
	hasResetButton: true,
};
