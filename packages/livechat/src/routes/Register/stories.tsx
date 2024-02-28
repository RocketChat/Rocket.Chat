import type { Meta, Story } from '@storybook/preact';
import type { ComponentProps } from 'preact';

import Register from '.';
import { screenDecorator, screenProps } from '../../../.storybook/helpers';

export default {
	title: 'Routes/Register',
	component: Register,
	args: {
		screenProps: screenProps(),
	},
	decorators: [screenDecorator],
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<ComponentProps<typeof Register>>;

const Template: Story<ComponentProps<typeof Register>> = (args) => <Register {...args} />;

export const Normal = Template.bind({});
Normal.storyName = 'normal';
