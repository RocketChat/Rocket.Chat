import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';

import VideoCallButton from './VideoCallButton';

const meta = {
	title: 'V2/Components/VideoCallButton',
	component: VideoCallButton,
	decorators: [
		mockAppRoot()
			.withTranslations('en', 'core', {
				Start_a_video_call: 'Start a video call',
				Join_video_call: 'Join video call',
				Switched_to_video_call: 'Switched to video call',
				VideoConf_start_call_modal_title: 'Starting a video call',
				VideoConf_start_call_modal_description: 'If you start a video call the current call will be finished. Do you want to proceed?',
				Start_video_call: 'Start video call',
				Cancel: 'Cancel',
			})
			.buildStoryDecorator(),
	],
	args: {
		onClick: fn(),
	},
} satisfies Meta<typeof VideoCallButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	name: 'Start state (no active video call)',
	args: {
		escalated: false,
	},
};

export const VideoCallActive: Story = {
	name: 'Active state (video call escalated)',
	args: {
		escalated: true,
	},
};
