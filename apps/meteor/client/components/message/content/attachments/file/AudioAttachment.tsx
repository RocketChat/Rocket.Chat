import type { AudioAttachmentProps } from '@rocket.chat/core-typings';
import { AudioPlayerControls, Box } from '@rocket.chat/fuselage';
import { useMediaUrl } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { useMediaPlayer } from '../../../../../providers/MediaPlayerProvider';
import type { PersistentAudioTrack } from '../../../../../providers/MediaPlayerProvider';
import MarkdownText from '../../../../MarkdownText';
import MessageCollapsible from '../../../MessageCollapsible';
import MessageContentBody from '../../../MessageContentBody';

/** Extra context about the message that owns this audio, used by the shared player. */
export type AudioAttachmentSource = {
	rid?: string;
	mid?: string;
	username?: string;
	name?: string;
};

const AudioAttachment = ({
	title,
	audio_url: url,
	audio_type: type,
	audio_size: size,
	description,
	descriptionMd,
	title_link: link,
	title_link_download: hasDownload,
	collapsed,
	source,
}: AudioAttachmentProps & { source?: AudioAttachmentSource }) => {
	const getURL = useMediaUrl();
	const src = useMemo(() => getURL(url), [getURL, url]);

	const { play, toggle, seek, cyclePlaybackRate, isActive, playing, currentTime, duration, playbackRate } = useMediaPlayer();

	const track = useMemo<PersistentAudioTrack>(
		() => ({
			id: `${source?.mid ?? ''}:${url}`,
			url: src,
			mediaType: type,
			title: title || url,
			size,
			rid: source?.rid,
			mid: source?.mid,
			username: source?.username,
			name: source?.name,
			resolveUrl: () => getURL(url),
		}),
		[source?.mid, source?.rid, source?.username, source?.name, url, src, type, title, size, getURL],
	);

	const active = isActive(track.id);

	return (
		<>
			{descriptionMd ? <MessageContentBody md={descriptionMd} /> : <MarkdownText parseEmoji content={description} />}
			<MessageCollapsible title={title} hasDownload={hasDownload} link={getURL(link || url)} size={size} isCollapsed={collapsed}>
				<Box
					borderWidth='default'
					borderStyle='solid'
					borderColor='extra-light'
					bg='tint'
					pb={12}
					pie={8}
					pis={16}
					borderRadius='x4'
					w='100%'
					maxWidth='x300'
				>
					<AudioPlayerControls
						isPlaying={active && playing}
						currentTime={active ? currentTime : 0}
						durationTime={active ? duration : 0}
						playbackSpeed={playbackRate}
						onTogglePlay={() => (active ? toggle() : play(track))}
						onSeek={(time) => (active ? seek(time) : play(track))}
						onChangePlaybackSpeed={cyclePlaybackRate}
					/>
				</Box>
			</MessageCollapsible>
		</>
	);
};

export default AudioAttachment;
