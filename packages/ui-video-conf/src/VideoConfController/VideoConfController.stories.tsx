import type { Meta, StoryFn } from '@storybook/react';

import VideoConfController from './VideoConfController';

export default {
	title: 'Components/VideoConfController',
	component: VideoConfController,
} satisfies Meta<typeof VideoConfController>;

export const Default: StoryFn<typeof VideoConfController> = (args) => <VideoConfController {...args} />;
Default.args = {
	'icon': 'info',
	'aria-label': 'info',
};
