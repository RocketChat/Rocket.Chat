import type { Meta, StoryFn } from '@storybook/preact';
import type { ComponentProps } from 'preact';

import VideoAttachment from '.';
import { sampleVideo } from '../../../../.storybook/helpers';

export default {
	title: 'Messages/VideoAttachment',
	component: VideoAttachment,
	args: {
		url: sampleVideo,
	},
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<ComponentProps<typeof VideoAttachment>>;

const Template: StoryFn<ComponentProps<typeof VideoAttachment>> = (args) => <VideoAttachment {...args} />;

export const Default = Template.bind({});
Default.storyName = 'default';
