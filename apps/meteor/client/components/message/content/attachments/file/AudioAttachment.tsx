import type { AudioAttachmentProps } from '@rocket.chat/core-typings';
import { AudioPlayer } from '@rocket.chat/fuselage';
import { useMediaUrl } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { useReloadOnError } from './hooks/useReloadOnError';
import MarkdownText from '../../../../MarkdownText';
import MessageCollapsible from '../../../MessageCollapsible';
import MessageContentBody from '../../../MessageContentBody';

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
}: AudioAttachmentProps) => {
	const getURL = useMediaUrl();
	const src = useMemo(() => getURL(url), [getURL, url]);
	const { mediaRef } = useReloadOnError(src, 'audio');

	return (
		<>
			{descriptionMd ? <MessageContentBody md={descriptionMd} /> : <MarkdownText parseEmoji content={description} />}
			<MessageCollapsible title={title} hasDownload={hasDownload} link={getURL(link || url)} size={size} isCollapsed={collapsed}>
				<AudioPlayer src={src} type={type} ref={mediaRef} />
			</MessageCollapsible>
		</>
	);
};

export default AudioAttachment;
