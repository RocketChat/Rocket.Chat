import { action } from '@storybook/addon-actions';
import type { Meta, Story } from '@storybook/preact';
import type { ComponentProps } from 'preact';

import { TextInput } from '.';
import { Form, FormField } from '..';

export default {
	title: 'Forms/TextInput',
	component: TextInput,
	args: {
		value: '',
		placeholder: 'Placeholder',
		disabled: false,
		small: false,
		error: false,
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
} satisfies Meta<ComponentProps<typeof TextInput>>;

const Template: Story<ComponentProps<typeof TextInput>> = (args) => <TextInput {...args} />;

export const Empty = Template.bind({});
Empty.storyName = 'empty';

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
