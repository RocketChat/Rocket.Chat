import type { Meta, StoryObj } from '@storybook/react';

import VideoPlayer from './VideoPlayer';
import { Box } from '../Box';

export default {
	title: 'Media/VideoPlayer',
	component: VideoPlayer,
	decorators: [
		(Story) => (
			<Box maxWidth='x368'>
				<Story />
			</Box>
		),
	],
} satisfies Meta<typeof VideoPlayer>;

type Story = StoryObj<typeof VideoPlayer>;

export const Default: Story = {
	args: {
		src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm',
		type: 'video/webm',
	},
};

export const LoadError: Story = {
	args: {
		src: 'https://example.invalid/missing.mp4',
		type: 'video/mp4',
	},
};
