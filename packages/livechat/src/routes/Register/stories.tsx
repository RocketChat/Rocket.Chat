import { action } from '@storybook/addon-actions';
import type { ComponentMeta, ComponentStory } from '@storybook/react';

import { screenDecorator, screenProps } from '../../helpers.stories';
import Register from './component';

export default {
	title: 'Routes/Register',
	component: Register,
	args: {
		title: '',
		message: '',
		hasNameField: true,
		hasEmailField: true,
		hasDepartmentField: true,
		departments: [
			{
				_id: 1,
				name: 'Department #1',
			},
			{
				_id: 2,
				name: 'Department #2',
			},
			{
				_id: 3,
				name: 'Department #3',
			},
		],
		loading: false,
		onSubmit: action('submit'),
		...screenProps(),
	},
	decorators: [screenDecorator],
	parameters: {
		layout: 'centered',
	},
} satisfies ComponentMeta<typeof Register>;

const Template: ComponentStory<typeof Register> = (args) => <Register {...args} />;

export const Normal = Template.bind({});
Normal.storyName = 'normal';

export const Loading = Template.bind({});
Loading.storyName = 'loading';
Loading.args = {
	loading: true,
};

export const WithCustomFields = Template.bind({});
WithCustomFields.storyName = 'with custom fields';
WithCustomFields.args = {
	customFields: [
		{
			_id: 'website',
			label: 'Website',
			type: 'input',
			required: true,
		},
		{
			_id: 'area',
			label: 'Area',
			type: 'select',
			defaultValue: 'Marketing',
			options: ['Human Resources', 'Sales', 'Marketing', 'Supply', 'Development'],
			required: true,
		},
	],
};
