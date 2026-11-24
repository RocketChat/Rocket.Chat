import {
	AudioPlayerControls,
	IconButton,
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemLink,
	ItemMedia,
	ItemTitle,
} from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useUserDisplayName } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import SidebarCard from './SidebarCard';
import { useAudioWaveform } from '../../components/message/content/attachments/file/hooks/useAudioWaveform';
import { useFormatMemorySize } from '../../hooks/useFormatMemorySize';
import { setMessageJumpQueryStringParameter } from '../../lib/utils/setMessageJumpQueryStringParameter';
import { useMediaPlayer } from '../../providers/MediaPlayerProvider';
import { useGoToRoom } from '../../views/room/hooks/useGoToRoom';

/**
 * Persistent audio card pinned to the bottom of the sidebar (design 1c).
 * It drives the shared audio element, so it stays available while a track is
 * loaded — including after switching or closing the room, or closing the thread
 * the audio was played from.
 */
const NowPlayingSection = () => {
	const { t } = useTranslation();
	const { track, playing, currentTime, duration, playbackRate, loading, error, toggle, seek, cyclePlaybackRate, retry, close } =
		useMediaPlayer();
	const goToRoom = useGoToRoom();
	const formatMemorySize = useFormatMemorySize();
	const waveform = useAudioWaveform(track?.url ?? '', track?.size);
	const displayName = useUserDisplayName({ name: track?.name, username: track?.username });

	if (!track) {
		return null;
	}

	const title = displayName || t('Audio');

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
			<Item multiline>
				{track.username && (
					<ItemMedia>
						<UserAvatar username={track.username} size='x24' />
					</ItemMedia>
				)}
				<ItemContent>
					<ItemTitle>
						{track.rid ? (
							<ItemLink is='button' onClick={() => void openConversation()} title={t('Jump_to_message')}>
								{title}
							</ItemLink>
						) : (
							title
						)}
					</ItemTitle>
					<ItemDescription>{track.size ? `${track.title} (${formatMemorySize(track.size)})` : track.title}</ItemDescription>
				</ItemContent>
				<ItemActions>
					<IconButton size='mini' icon='cross' onClick={close} title={t('Close')} aria-label={t('Close')} />
				</ItemActions>
			</Item>

			<AudioPlayerControls
				isPlaying={playing}
				currentTime={currentTime}
				durationTime={duration}
				playbackSpeed={playbackRate}
				waveform={waveform}
				loading={loading}
				error={error}
				onRetry={retry}
				onTogglePlay={toggle}
				onSeek={seek}
				onChangePlaybackSpeed={cyclePlaybackRate}
			/>
		</SidebarCard>
	);
};

export default NowPlayingSection;
