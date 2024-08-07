import type { ComponentMeta, ComponentStory } from '@storybook/react';

import VideoConfController from './VideoConfController';

export default {
	title: 'Components/VideoConfController',
	component: VideoConfController,
} satisfies ComponentMeta<typeof VideoConfController>;

export const Default: ComponentStory<typeof VideoConfController> = (args) => <VideoConfController {...args} />;
Default.args = {
	'icon': 'info',
	'aria-label': 'info',
};
