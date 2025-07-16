import type { Meta, StoryFn } from '@storybook/preact';
import type { ComponentProps } from 'preact';

import Register from '.';
import { screenDecorator } from '../../../.storybook/helpers';

export default {
	title: 'Routes/Register',
	component: Register,
	decorators: [screenDecorator],
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<ComponentProps<typeof Register>>;

const Template: StoryFn<ComponentProps<typeof Register>> = (args) => <Register {...args} />;

export const Normal = Template.bind({});
Normal.storyName = 'normal';
