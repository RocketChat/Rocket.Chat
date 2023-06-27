import { action } from '@storybook/addon-actions';
import type { Meta, Story } from '@storybook/preact';
import type { ComponentProps } from 'preact';

import { SelectInput } from '.';
import { Form, FormField } from '..';

export default {
	title: 'Forms/SelectInput',
	component: SelectInput,
	args: {
		value: '',
		options: [
			{ value: '1', label: 'Option 1' },
			{ value: '2', label: 'Option 2' },
			{ value: '3', label: 'Option 3' },
		],
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
} satisfies Meta<ComponentProps<typeof SelectInput>>;

const Template: Story<ComponentProps<typeof SelectInput>> = (args) => <SelectInput {...args} />;

export const Empty = Template.bind({});
Empty.storyName = 'empty';

export const Selected = Template.bind({});
Selected.storyName = 'selected';
Selected.args = {
	value: '2',
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
