import { Box, IconButton } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useTranslation } from 'react-i18next';

import AudioPlayerControls from '../../components/AudioPlayer/AudioPlayerControls';
import { useMediaPlayer } from '../../providers/MediaPlayerProvider';
import { useGoToRoom } from '../../views/room/hooks/useGoToRoom';

/**
 * Persistent "now playing" card pinned to the top of the sidebar (design 1c).
 * It re-attaches to the shared audio element, so playback survives switching or
 * closing the room where the audio was sent.
 */
const NowPlayingSection = () => {
	const { t } = useTranslation();
	const { track, playing, currentTime, duration, playbackRate, toggle, seek, cyclePlaybackRate, close } = useMediaPlayer();
	const goToRoom = useGoToRoom();

	if (!track) {
		return null;
	}

	const openConversation = () => {
		if (track.rid) {
			void goToRoom(track.rid);
		}
	};

	return (
		<Box m={8} p={10} borderRadius={8} backgroundColor='surface-tint' style={{ border: '1px solid var(--rcx-color-stroke-highlight)' }}>
			<Box display='flex' alignItems='center' justifyContent='space-between' mbe={8}>
				<Box display='flex' alignItems='center' color='info' fontScale='micro' style={{ gap: 6, textTransform: 'uppercase' }}>
					<Box style={{ width: 7, height: 7, borderRadius: 999, background: 'var(--rcx-color-button-background-primary-default)' }} />
					{t('Now_playing')}
				</Box>
				<IconButton mini icon='cross' onClick={close} title={t('Close')} aria-label={t('Close')} />
			</Box>

			<Box display='flex' alignItems='center' mbe={10} style={{ gap: 8 }}>
				{track.username && <UserAvatar username={track.username} size='x24' />}
				<Box minWidth={0} onClick={openConversation} title={t('Jump_to_message')} style={{ cursor: track.rid ? 'pointer' : 'default' }}>
					<Box fontScale='p2b' color='default' withTruncatedText>
						{track.name || track.username || t('Audio')}
					</Box>
					<Box fontScale='micro' color='info' withTruncatedText>
						{track.title}
					</Box>
				</Box>
			</Box>

			<AudioPlayerControls
				compact
				playing={playing}
				currentTime={currentTime}
				duration={duration}
				playbackRate={playbackRate}
				onToggle={toggle}
				onSeek={seek}
				onCyclePlaybackRate={cyclePlaybackRate}
			/>
		</Box>
	);
};

export default NowPlayingSection;
