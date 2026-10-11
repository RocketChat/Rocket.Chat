import type { Meta, StoryFn } from '@storybook/preact';

import SwitchDepartment, { type SwitchDepartmentProps } from './index';
import { screenDecorator, storeDecorator } from '../../../.storybook/helpers';
import type { Department } from '../../definitions/departments';
import store, { type StoreState } from '../../store';

type StoryArgs = SwitchDepartmentProps & Partial<StoreState>;

const departments: Department[] = [
	{ _id: '1', name: 'Department #1', showOnRegistration: true },
	{ _id: '2', name: 'Department #2', showOnRegistration: true },
	{ _id: '3', name: 'Department #3', showOnRegistration: true },
];

export default {
	title: 'Routes/SwitchDepartment',
	component: SwitchDepartment,
	args: {
		config: {
			...store.state.config,
			departments,
		},
		loading: false,
	},
	decorators: [storeDecorator, screenDecorator],
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<StoryArgs>;

const Template: StoryFn<StoryArgs> = (args) => <SwitchDepartment {...args} />;

export const Normal = Template.bind({});
Normal.storyName = 'normal';
