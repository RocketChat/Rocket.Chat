import { Field } from '@rocket.chat/fuselage';
import type { Meta, StoryFn } from '@storybook/react';

import SliderSettingInput from './SliderSettingInput';

export default {
	component: SliderSettingInput,
	parameters: {
		actions: {
			argTypesRegex: '^on.*',
		},
	},
	decorators: [(fn) => <Field>{fn()}</Field>],
} satisfies Meta<typeof SliderSettingInput>;

const Template: StoryFn<typeof SliderSettingInput> = (args) => (
	<SliderSettingInput {...args} _id='setting_id' label='Label' minValue={0} maxValue={100} />
);

export const Default = Template.bind({});

export const Disabled = Template.bind({});
Disabled.args = {
	disabled: true,
};

export const WithValue = Template.bind({});
WithValue.args = {
	value: 50,
};

export const WithHint = Template.bind({});
WithHint.args = {
	value: 50,
	hint: 'This is a hint for the slider',
};

export const WithResetButton = Template.bind({});
WithResetButton.args = {
	value: 50,
	hasResetButton: true,
};
