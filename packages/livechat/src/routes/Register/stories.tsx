import type { Meta, StoryFn } from '@storybook/preact';

import type { RegisterProps } from '.';
import Register from '.';
import { screenDecorator } from '../../../.storybook/helpers';

export default {
	title: 'Routes/Register',
	component: Register,
	decorators: [screenDecorator],
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<RegisterProps>;

const Template: StoryFn<RegisterProps> = (args) => <Register {...args} />;

export const Normal = Template.bind({});
Normal.storyName = 'normal';
