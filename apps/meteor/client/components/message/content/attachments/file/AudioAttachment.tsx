import type { AudioAttachmentProps } from '@rocket.chat/core-typings';
import { AudioPlayer } from '@rocket.chat/fuselage';
import { useMergedRefs } from '@rocket.chat/fuselage-hooks';
import { useMediaUrl } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { usePersistentAudio } from './hooks/usePersistentAudio';
import { useReloadOnError } from './hooks/useReloadOnError';
import type { PersistentAudioTrack } from '../../../../../providers/MediaPlayerProvider';
import MarkdownText from '../../../../MarkdownText';
import MessageCollapsible from '../../../MessageCollapsible';
import MessageContentBody from '../../../MessageContentBody';

/** Extra context about the message that owns this audio, used by the persistent player. */
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
	const { mediaRef } = useReloadOnError(src, 'audio');

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

	const persistentRef = usePersistentAudio(track);
	const ref = useMergedRefs(mediaRef, persistentRef);

	return (
		<>
			{descriptionMd ? <MessageContentBody md={descriptionMd} /> : <MarkdownText parseEmoji content={description} />}
			<MessageCollapsible title={title} hasDownload={hasDownload} link={getURL(link || url)} size={size} isCollapsed={collapsed}>
				<AudioPlayer src={src} type={type} ref={ref} />
			</MessageCollapsible>
		</>
	);
};

export default AudioAttachment;
