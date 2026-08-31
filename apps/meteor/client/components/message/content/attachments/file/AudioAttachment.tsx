import type { AudioAttachmentProps } from '@rocket.chat/core-typings';
import { AudioPlayerControls, Box } from '@rocket.chat/fuselage';
import { useMediaUrl } from '@rocket.chat/ui-contexts';
import { useMemo, useState } from 'react';

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

type AudioAttachmentComponentProps = AudioAttachmentProps & {
	source?: AudioAttachmentSource;
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
}: AudioAttachmentComponentProps) => {
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
		}),
		[source?.mid, source?.rid, source?.username, source?.name, url, src, type, title, size],
	);

	const active = isActive(track.id);
	const [previewDuration, setPreviewDuration] = useState(0);

	return (
		<>
			{descriptionMd ? <MessageContentBody md={descriptionMd} /> : <MarkdownText parseEmoji content={description} />}
			<MessageCollapsible title={title} hasDownload={hasDownload} link={getURL(link || url)} size={size} isCollapsed={collapsed}>
				<Box
					borderWidth='default'
					borderStyle='solid'
					borderColor='extra-light'
					backgroundColor='tint'
					paddingBlock={12}
					paddingInlineEnd={8}
					paddingInlineStart={16}
					borderRadius='x4'
					width='100%'
					maxWidth='x300'
				>
					<AudioPlayerControls
						isPlaying={active && playing}
						currentTime={active ? currentTime : 0}
						durationTime={active && duration ? duration : previewDuration}
						playbackSpeed={playbackRate}
						onTogglePlay={() => (active ? toggle() : play(track))}
						onSeek={(time) => (active ? seek(time) : play(track))}
						onChangePlaybackSpeed={cyclePlaybackRate}
					/>
					{/* Loads only metadata so the controls show the length before this track becomes the shared player's active one. */}
					<audio
						hidden
						preload='metadata'
						src={src}
						onLoadedMetadata={(e) => setPreviewDuration(Number.isFinite(e.currentTarget.duration) ? e.currentTarget.duration : 0)}
					>
						<track kind='captions' />
					</audio>
				</Box>
			</MessageCollapsible>
		</>
	);
};

export default AudioAttachment;
