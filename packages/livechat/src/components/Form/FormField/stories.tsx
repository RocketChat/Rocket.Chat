import type { Meta, StoryFn } from '@storybook/preact';
import type { ComponentProps } from 'preact';

import { FormField } from '.';
import { Form, TextInput } from '..';
import { loremIpsum } from '../../../../.storybook/helpers';

export default {
	title: 'Forms/FormField',
	component: FormField,
	args: {
		required: false,
		label: 'Label',
		description: 'Description',
		error: '',
	},
	decorators: [(storyFn) => <Form>{storyFn()}</Form>],
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<ComponentProps<typeof FormField>>;

const Template: StoryFn<ComponentProps<typeof FormField>> = (args) => (
	<FormField {...args}>
		<TextInput value={loremIpsum({ count: 3, units: 'words' })} />
	</FormField>
);

export const Normal = Template.bind({});
Normal.storyName = 'normal';

export const Required = Template.bind({});
Required.storyName = 'required';
Required.args = {
	required: true,
};

export const WithError = Template.bind({});
WithError.storyName = 'with error';
WithError.args = {
	error: 'Error',
};
