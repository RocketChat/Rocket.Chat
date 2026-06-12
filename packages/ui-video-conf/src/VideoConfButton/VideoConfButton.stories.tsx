import type { Meta, StoryObj } from '@storybook/react';

import VideoConfButton from './VideoConfButton';

export default {
	component: VideoConfButton,
	decorators: [],
} satisfies Meta<typeof VideoConfButton>;

export const Default: StoryObj<typeof VideoConfButton> = {
	render: (args) => <VideoConfButton {...args}>Button</VideoConfButton>,
};
