import { Box } from '@rocket.chat/fuselage';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';
import type { ContextType } from 'react';

import NowPlayingSection from './NowPlayingSection';
import { MediaPlayerContext } from '../../providers/MediaPlayerProvider';
import type { PersistentAudioTrack } from '../../providers/MediaPlayerProvider';

const noop = () => undefined;

const baseTrack: PersistentAudioTrack = {
	id: 'mid:url',
	url: '',
	title: 'Audio record.mp3',
	size: 48_000,
	rid: 'GENERAL',
	mid: 'mid',
	username: 'guilherme.gazzo',
	name: 'Guilherme Gazzo',
};

const playerValue = (track: PersistentAudioTrack): ContextType<typeof MediaPlayerContext> => ({
	track,
	playing: true,
	currentTime: 2,
	duration: 10,
	playbackRate: 1,
	loading: false,
	error: false,
	play: noop,
	toggle: noop,
	seek: noop,
	cyclePlaybackRate: noop,
	retry: noop,
	close: noop,
	activeTrackId: track.id,
});

export default {
	title: 'Sidebar/NowPlayingSection',
	component: NowPlayingSection,
	parameters: {
		layout: 'padded',
	},
	decorators: [
		(Story) => (
			<Box width={280}>
				<Story />
			</Box>
		),
		mockAppRoot().withJohnDoe().buildStoryDecorator(),
	],
} satisfies Meta<typeof NowPlayingSection>;

type Story = StoryObj<typeof NowPlayingSection>;

const withTrack =
	(track: PersistentAudioTrack): NonNullable<Story['decorators']> =>
	(Story) => (
		<MediaPlayerContext.Provider value={playerValue(track)}>
			<Story />
		</MediaPlayerContext.Provider>
	);

export const Default: Story = {
	decorators: withTrack(baseTrack),
};

export const LongSubtitle: Story = {
	decorators: withTrack({
		...baseTrack,
		title: 'Audio recordAudio recordAudio recordAudio recordAudio recordAudio recordAudio record.mp3',
	}),
};

export const LongNameAndSubtitle: Story = {
	decorators: withTrack({
		...baseTrack,
		name: 'Guilherme Gazzo with a very long display name that does not fit',
		title: 'Audio recordAudio recordAudio recordAudio recordAudio recordAudio recordAudio record.mp3',
	}),
};

export const WithoutAvatar: Story = {
	decorators: withTrack({ ...baseTrack, username: undefined }),
};
