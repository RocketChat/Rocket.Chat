import { action } from '@storybook/addon-actions';
import type { Meta, Story } from '@storybook/preact';
import type { ComponentProps } from 'preact';

import { screenDecorator, screenProps } from '../../helpers.stories';
import SwitchDepartment from './index';

export default {
	title: 'Routes/SwitchDepartment',
	component: SwitchDepartment,
	args: {
		title: '',
		message: '',
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
		onCancel: action('cancel'),
		...screenProps(),
	},
	decorators: [screenDecorator],
	parameters: {
		layout: 'centered',
	},
} as Meta<ComponentProps<typeof SwitchDepartment>>;

const Template: Story<ComponentProps<typeof SwitchDepartment>> = (args) => <SwitchDepartment {...args} />;

export const Normal = Template.bind({});
Normal.storyName = 'normal';
