import type { Meta, StoryObj } from '@storybook/react';

import AudioPlayerControls from './AudioPlayerControls';
import { Box } from '../Box';

export default {
	title: 'Media/AudioPlayerControls',
	component: AudioPlayerControls,
	args: {
		isPlaying: false,
		currentTime: 0,
		durationTime: 135,
		playbackSpeed: 1,
		onTogglePlay: () => undefined,
		onSeek: () => undefined,
		onChangePlaybackSpeed: () => undefined,
	},
	decorators: [
		(Story) => (
			<Box maxWidth='x368'>
				<Story />
			</Box>
		),
	],
} satisfies Meta<typeof AudioPlayerControls>;

type Story = StoryObj<typeof AudioPlayerControls>;

export const Idle: Story = {};

export const Playing: Story = {
	args: { isPlaying: true, currentTime: 42, playbackSpeed: 1.25 },
};

export const LongDuration: Story = {
	args: { isPlaying: true, currentTime: 3725, durationTime: 5400 },
};

export const Loading: Story = {
	args: { loading: true, durationTime: 0 },
};

export const LoadError: Story = {
	args: { error: true, onRetry: () => undefined },
};

export const WithDownload: Story = {
	args: { download: true, downloadHref: '#' },
};

export const Waveform: Story = {
	args: {
		isPlaying: true,
		currentTime: 9,
		durationTime: 24,
		playbackSpeed: 1.5,
		waveform: [
			0.3, 0.5, 0.8, 0.4, 0.9, 0.7, 0.35, 0.6, 1, 0.85, 0.45, 0.3, 0.7, 0.9, 0.5, 0.75, 0.4, 0.6, 0.85, 0.45, 0.3, 0.5, 0.75, 1, 0.7, 0.4,
			0.5, 0.85, 0.6, 0.3, 0.45, 0.75, 0.9, 0.5, 0.4, 0.7, 0.85, 0.45, 0.3, 0.6,
		],
	},
};
