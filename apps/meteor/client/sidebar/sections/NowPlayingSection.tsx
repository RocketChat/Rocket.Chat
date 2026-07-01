import { Box, IconButton } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useUserDisplayName } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import SidebarCard from './SidebarCard';
import AudioPlayerControls from '../../components/AudioPlayer/AudioPlayerControls';
import { useFormatMemorySize } from '../../hooks/useFormatMemorySize';
import { useOpenedRoom } from '../../lib/RoomManager';
import { setMessageJumpQueryStringParameter } from '../../lib/utils/setMessageJumpQueryStringParameter';
import { useMediaPlayer } from '../../providers/MediaPlayerProvider';
import { useGoToRoom } from '../../views/room/hooks/useGoToRoom';

/**
 * Persistent audio card pinned to the bottom of the sidebar (design 1c).
 * It drives the shared audio element, so playback survives switching or closing
 * the room where the audio was sent. Hidden while the source room is open (the
 * in-message player is visible there).
 */
const NowPlayingSection = () => {
	const { t } = useTranslation();
	const { track, playing, currentTime, duration, playbackRate, toggle, seek, cyclePlaybackRate, close } = useMediaPlayer();
	const goToRoom = useGoToRoom();
	const openedRoom = useOpenedRoom();
	const formatMemorySize = useFormatMemorySize();
	const displayName = useUserDisplayName({ name: track?.name, username: track?.username });

	if (!track || (track.rid && track.rid === openedRoom)) {
		return null;
	}

	const openConversation = async () => {
		if (!track.rid) {
			return;
		}
		await goToRoom(track.rid);
		if (track.mid) {
			void setMessageJumpQueryStringParameter(track.mid);
		}
	};

	return (
		<SidebarCard>
			<Box display='flex' alignItems='center' justifyContent='space-between' mbe={10} style={{ gap: 8 }}>
				<Box
					display='flex'
					alignItems='center'
					minWidth={0}
					flexGrow={1}
					onClick={() => void openConversation()}
					title={t('Jump_to_message')}
					style={{ gap: 8, cursor: track.rid ? 'pointer' : 'default' }}
				>
					{track.username && <UserAvatar username={track.username} size='x24' />}
					<Box minWidth={0}>
						<Box fontScale='p2b' color='default' withTruncatedText>
							{displayName || t('Audio')}
						</Box>
						<Box fontScale='micro' color='hint' withTruncatedText>
							{track.size ? `${track.title} (${formatMemorySize(track.size)})` : track.title}
						</Box>
					</Box>
				</Box>
				<IconButton mini icon='cross' onClick={close} title={t('Close')} aria-label={t('Close')} />
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
		</SidebarCard>
	);
};

export default NowPlayingSection;
