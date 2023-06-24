import { action } from '@storybook/addon-actions';
import type { Meta, Story } from '@storybook/preact';
import type { ComponentProps } from 'preact';

import { PasswordInput } from '.';
import { Form, FormField } from '..';

export default {
	title: 'Forms/PasswordInput',
	component: PasswordInput,
	args: {
		value: '',
		placeholder: 'Placeholder',
		disabled: false,
		small: false,
		error: false,
		onChange: action('change'),
		onInput: action('input'),
	},
	decorators: [
		(storyFn) => (
			<Form>
				<FormField>{storyFn()}</FormField>
			</Form>
		),
	],
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<ComponentProps<typeof PasswordInput>>;

const Template: Story<ComponentProps<typeof PasswordInput>> = (args) => <PasswordInput {...args} />;

export const Default = Template.bind({});
Default.storyName = 'default';

export const Filled = Template.bind({});
Filled.storyName = 'filled';
Filled.args = {
	value: 'Value',
};

export const Disabled = Template.bind({});
Disabled.storyName = 'disabled';
Disabled.args = {
	disabled: true,
};

export const Small = Template.bind({});
Small.storyName = 'small';
Small.args = {
	small: true,
};

export const WithError = Template.bind({});
WithError.storyName = 'with error';
WithError.args = {
	error: true,
};
