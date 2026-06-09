import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';

import VideoCallWidgetAction from './VideoCallWidgetAction';

const meta = {
	title: 'V2/Components/VideoCallWidgetAction',
	component: VideoCallWidgetAction,
	decorators: [
		mockAppRoot()
			.withTranslations('en', 'core', {
				Start_a_video_call: 'Start a video call',
				Join_video_call: 'Join video call',
				Switched_to_video_call: 'Switched to video call',
			})
			.buildStoryDecorator(),
	],
	args: {
		onClick: fn(),
	},
} satisfies Meta<typeof VideoCallWidgetAction>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	name: 'Default (not escalated)',
	args: {
		escalated: false,
		loading: false,
	},
};

export const Escalated: Story = {
	name: 'Escalated (video call active)',
	args: {
		escalated: true,
		loading: false,
	},
};

export const Loading: Story = {
	name: 'Loading state',
	args: {
		escalated: false,
		loading: true,
	},
};
