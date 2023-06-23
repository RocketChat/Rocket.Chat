import type { ComponentMeta, ComponentStory } from '@storybook/react';

import VideoAttachment from '.';
import { sampleVideo } from '../../../helpers.stories';

export default {
	title: 'Messages/VideoAttachment',
	component: VideoAttachment,
	args: {
		url: sampleVideo,
	},
	parameters: {
		layout: 'centered',
	},
} satisfies ComponentMeta<typeof VideoAttachment>;

const Template: ComponentStory<typeof VideoAttachment> = (args) => <VideoAttachment {...args} />;

export const Default = Template.bind({});
Default.storyName = 'default';
