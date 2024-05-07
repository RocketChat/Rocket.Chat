import { action } from '@storybook/addon-actions';
import type { Meta, Story } from '@storybook/preact';
import type { ComponentProps } from 'preact';

import { Button } from '.';
import { gazzoAvatar } from '../../../.storybook/helpers';
import ChatIcon from '../../icons/chat.svg';

const iconElement = <ChatIcon />;

export default {
	title: 'components/Button',
	component: Button,
	args: {
		disabled: false,
		outline: false,
		nude: false,
		danger: false,
		secondary: false,
		stack: false,
		small: false,
		loading: false,
		badge: undefined,
		icon: null,
		img: undefined,
		children: 'Powered by Rocket.Chat',
		onClick: action('clicked'),
	},
	argTypes: {
		icon: {
			control: {
				type: 'select',
				options: [null, iconElement],
			},
		},
	},
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<ComponentProps<typeof Button>>;

const Template: Story<ComponentProps<typeof Button>> = (args) => <Button {...args} />;

export const Normal = Template.bind({});
Normal.storyName = 'normal';

export const Disabled = Template.bind({});
Disabled.storyName = 'disabled';
Disabled.args = {
	disabled: true,
};

export const Outline = Template.bind({});
Outline.storyName = 'outline';
Outline.args = {
	outline: true,
};

export const Nude = Template.bind({});
Nude.storyName = 'nude';
Nude.args = {
	nude: true,
};

export const Danger = Template.bind({});
Danger.storyName = 'danger';
Danger.args = {
	danger: true,
};

export const Secondary = Template.bind({});
Secondary.storyName = 'secondary';
Secondary.args = {
	secondary: true,
};

export const Stack = Template.bind({});
Stack.storyName = 'stack';
Stack.args = {
	stack: true,
};

export const Small = Template.bind({});
Small.storyName = 'small';
Small.args = {
	small: true,
};

export const Loading = Template.bind({});
Loading.storyName = 'loading';
Loading.args = {
	loading: true,
};

export const WithBadge = Template.bind({});
WithBadge.storyName = 'with badge';
WithBadge.args = {
	badge: 123,
};

export const WithIcon = Template.bind({});
WithIcon.storyName = 'with icon';
WithIcon.args = {
	icon: iconElement,
};

export const TransparentWithBackgroundImage = Template.bind({});
TransparentWithBackgroundImage.storyName = 'transparent with background image';
TransparentWithBackgroundImage.args = {
	img: gazzoAvatar,
	icon: iconElement,
};
