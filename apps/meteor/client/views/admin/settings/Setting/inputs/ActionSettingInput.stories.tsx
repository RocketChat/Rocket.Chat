import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Field } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import type { Meta, StoryFn } from '@storybook/react';

import ActionSettingInput from './ActionSettingInput';

export default {
	title: 'Admin/Settings/Inputs/ActionSettingInput',
	component: ActionSettingInput,
	decorators: [(fn) => <Field>{fn()}</Field>],
} satisfies Meta<typeof ActionSettingInput>;

const Template: StoryFn<typeof ActionSettingInput> = (args) => <ActionSettingInput {...args} />;

export const Default = Template.bind({});
Default.args = {
	_id: 'setting_id',
	actionText: 'Action text' as TranslationKey,
	value: 'methodName' as keyof ServerMethods,
};

export const Disabled = Template.bind({});
Disabled.args = {
	_id: 'setting_id',
	actionText: 'Action text' as TranslationKey,
	value: 'methodName' as keyof ServerMethods,
	disabled: true,
};

export const WithinChangedSection = Template.bind({});
WithinChangedSection.args = {
	_id: 'setting_id',
	actionText: 'Action text' as TranslationKey,
	value: 'methodName' as keyof ServerMethods,
	sectionChanged: true,
};
