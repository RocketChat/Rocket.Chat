import type { Meta, StoryObj } from '@storybook/react-webpack5';

import AudioPlayer from './AudioPlayer';

export default {
	title: 'Media/AudioPlayer',
	component: AudioPlayer,
	argTypes: {
		src: {
			control: 'text',
			description: 'URL of the audio file to play.',
			table: { category: 'Content' },
		},
		type: {
			control: 'text',
			description: 'MIME type of the audio source.',
			table: { category: 'Content' },
		},
		download: {
			control: 'boolean',
			description: 'Shows a download button that saves the audio file to disk.',
			table: { category: 'Content' },
		},
		trackProps: {
			control: false,
			description: 'HTML attributes passed through to the captions `<track>` element.',
			table: { category: 'Content' },
		},
		maxPlaybackSpeed: {
			control: 'number',
			description: 'Upper bound for the playback rate control.',
			table: { category: 'Playback Speed' },
		},
		minPlaybackSpeed: {
			control: 'number',
			description: 'Lower bound for the playback rate control; also the value it wraps back to after reaching the max.',
			table: { category: 'Playback Speed' },
		},
		playbackSpeedStep: {
			control: 'number',
			description: 'Increment applied to the playback rate each time the speed control is activated.',
			table: { category: 'Playback Speed' },
		},
		playLabel: {
			control: 'text',
			description: 'Accessible label for the play button.',
			table: { category: 'Accessibility' },
		},
		pauseLabel: {
			control: 'text',
			description: 'Accessible label for the pause button.',
			table: { category: 'Accessibility' },
		},
		audioPlaybackRangeLabel: {
			control: 'text',
			description: 'Accessible label for the playback range slider.',
			table: { category: 'Accessibility' },
		},
		changePlaybackSpeedLabel: {
			control: 'text',
			description: 'Accessible label for the change playback speed control.',
			table: { category: 'Accessibility' },
		},
		downloadAudioFileLabel: {
			control: 'text',
			description: 'Accessible label for the download button.',
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
