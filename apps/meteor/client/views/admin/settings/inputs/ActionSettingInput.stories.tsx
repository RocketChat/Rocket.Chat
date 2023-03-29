import { Field } from '@rocket.chat/fuselage';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import type keys from '../../../../../packages/rocketchat-i18n/i18n/en.i18n.json';
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
	actionText: 'Action text' as keyof typeof keys,
	value: 'methodName' as keyof ServerMethods,
};

export const Disabled = Template.bind({});
Disabled.args = {
	_id: 'setting_id',
	actionText: 'Action text' as keyof typeof keys,
	value: 'methodName' as keyof ServerMethods,
	disabled: true,
};

export const WithinChangedSection = Template.bind({});
WithinChangedSection.args = {
	_id: 'setting_id',
	actionText: 'Action text' as keyof typeof keys,
	value: 'methodName' as keyof ServerMethods,
	sectionChanged: true,
};
