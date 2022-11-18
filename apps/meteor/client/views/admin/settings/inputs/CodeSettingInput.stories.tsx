import { Field } from '@rocket.chat/fuselage';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

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
			<div className='rc-old'>
				<Field>{fn()}</Field>
			</div>
		),
	],
} as ComponentMeta<typeof CodeSettingInput>;

const Template: ComponentStory<typeof CodeSettingInput> = (args) => <CodeSettingInput {...args} />;

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

export const WithResetButton = Template.bind({});
WithResetButton.args = {
	_id: 'setting_id',
	label: 'Label',
	value: 'console.log("Hello World!");',
	placeholder: 'Placeholder',
	hasResetButton: true,
};
