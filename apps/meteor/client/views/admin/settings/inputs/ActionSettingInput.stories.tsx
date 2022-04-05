import { Field } from '@rocket.chat/fuselage';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import ActionSettingInput from './ActionSettingInput';

export default {
	title: 'Admin/Settings/Inputs/ActionSettingInput',
	component: ActionSettingInput,
	decorators: [(fn) => <Field>{fn()}</Field>],
} as ComponentMeta<typeof ActionSettingInput>;

const Template: ComponentStory<typeof ActionSettingInput> = (args) => <ActionSettingInput {...args} />;

export const Default = Template.bind({});
Default.args = {
	_id: 'setting_id',
	actionText: 'Action text',
	value: 'methodName',
};

export const Disabled = Template.bind({});
Disabled.args = {
	_id: 'setting_id',
	actionText: 'Action text',
	value: 'methodName',
	disabled: true,
};

export const WithinChangedSection = Template.bind({});
WithinChangedSection.args = {
	_id: 'setting_id',
	actionText: 'Action text',
	value: 'methodName',
	sectionChanged: true,
};
