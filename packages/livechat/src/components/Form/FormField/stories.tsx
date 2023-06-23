import type { ComponentMeta, ComponentStory } from '@storybook/react';

import { FormField } from '.';
import { Form, TextInput } from '..';
import { loremIpsum } from '../../../helpers.stories';

export default {
	title: 'Forms/FormField',
	component: FormField,
	args: {
		children: <TextInput value={loremIpsum({ count: 3, units: 'words' })} />,
		required: false,
		label: 'Label',
		description: 'Description',
		error: '',
	},
	decorators: [(storyFn) => <Form>{storyFn()}</Form>],
	parameters: {
		layout: 'centered',
	},
} satisfies ComponentMeta<typeof FormField>;

const Template: ComponentStory<typeof FormField> = (args) => <FormField {...args} />;

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
