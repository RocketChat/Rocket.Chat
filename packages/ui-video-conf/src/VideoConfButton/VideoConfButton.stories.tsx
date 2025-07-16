import type { Meta, StoryFn } from '@storybook/react';

import VideoConfButton from './VideoConfButton';

export default {
	title: 'Components/VideoConfButton',
	component: VideoConfButton,
	decorators: [],
} satisfies Meta<typeof VideoConfButton>;

export const Default: StoryFn<typeof VideoConfButton> = (args) => <VideoConfButton {...args}>Button</VideoConfButton>;
