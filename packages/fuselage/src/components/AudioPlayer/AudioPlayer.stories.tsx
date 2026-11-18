import type { Meta, StoryObj } from '@storybook/react';

import AudioPlayer from './AudioPlayer';

export default {
	title: 'Media/AudioPlayer',
	component: AudioPlayer,
	argTypes: {
		src: {
			control: 'text',
			table: { category: 'Content' },
		},
		type: {
			control: 'text',
			table: { category: 'Content' },
		},
		download: {
			control: 'boolean',
			table: { category: 'Content' },
		},
		trackProps: {
			control: false,
			table: { category: 'Content' },
		},
		maxPlaybackSpeed: {
			control: 'number',
			table: { category: 'Playback Speed' },
		},
		minPlaybackSpeed: {
			control: 'number',
			table: { category: 'Playback Speed' },
		},
		playbackSpeedStep: {
			control: 'number',
			table: { category: 'Playback Speed' },
		},
		playLabel: {
			control: 'text',
			table: { category: 'Accessibility' },
		},
		pauseLabel: {
			control: 'text',
			table: { category: 'Accessibility' },
		},
		audioPlaybackRangeLabel: {
			control: 'text',
			table: { category: 'Accessibility' },
		},
		changePlaybackSpeedLabel: {
			control: 'text',
			table: { category: 'Accessibility' },
		},
		downloadAudioFileLabel: {
			control: 'text',
			table: { category: 'Accessibility' },
		},
	},
} satisfies Meta<typeof AudioPlayer>;

type Story = StoryObj<typeof AudioPlayer>;

const AUDIO_URL = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-17.mp3';

export const AudioPlayerDefault: Story = {
	args: {
		src: AUDIO_URL,
	},
};
