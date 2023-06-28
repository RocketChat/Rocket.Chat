import { action } from '@storybook/addon-actions';
import type { Meta, Story } from '@storybook/preact';
import type { ComponentProps } from 'preact';

import Alert from '.';
import { loremIpsum, screenDecorator } from '../../helpers.stories';

export default {
	title: 'Components/Alert',
	component: Alert,
	args: {
		success: false,
		warning: false,
		error: false,
		color: '',
		timeout: 5000,
		onDismiss: action('dismiss'),
		children: loremIpsum({ count: 3, units: 'words' }),
	},
	parameters: {
		layout: 'centered',
	},
	decorators: [screenDecorator],
} satisfies Meta<ComponentProps<typeof Alert>>;

const Template: Story<ComponentProps<typeof Alert>> = (args) => <Alert {...args} />;

export const Default = Template.bind({});
Default.storyName = 'default';
Default.args = {};

export const Success = Template.bind({});
Success.storyName = 'success';
Success.args = {
	success: true,
};

export const Warning = Template.bind({});
Warning.storyName = 'warning';
Warning.args = {
	warning: true,
};

export const Error = Template.bind({});
Error.storyName = 'error';
Error.args = {
	error: true,
};

export const CustomColor = Template.bind({});
CustomColor.storyName = 'custom color';
CustomColor.args = {
	color: '#175CC4',
};

export const WithLongTextContent = Template.bind({});
WithLongTextContent.storyName = 'with long text content';
WithLongTextContent.args = {
	children: loremIpsum({ count: 30, units: 'words' }),
};

export const WithoutTimeout = Template.bind({});
WithoutTimeout.storyName = 'without timeout';
WithoutTimeout.args = {
	timeout: 0,
};
