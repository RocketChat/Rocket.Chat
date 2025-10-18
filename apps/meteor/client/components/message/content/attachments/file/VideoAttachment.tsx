import type { VideoAttachmentProps } from '@rocket.chat/core-typings';
import { MessageGenericPreview } from '@rocket.chat/fuselage';
import { useMediaUrl } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { useReloadOnError } from './hooks/useReloadOnError';
import MarkdownText from '../../../../MarkdownText';
import MessageCollapsible from '../../../MessageCollapsible';
import MessageContentBody from '../../../MessageContentBody';

const VideoAttachment = ({
	title,
	video_url: url,
	video_size: size,
	description,
	descriptionMd,
	title_link: link,
	title_link_download: hasDownload,
	collapsed,
}: VideoAttachmentProps) => {
	const getURL = useMediaUrl();
	const src = useMemo(() => getURL(url), [getURL, url]);
	const { mediaRef } = useReloadOnError(src, 'video');

	return (
		<>
			{descriptionMd ? <MessageContentBody md={descriptionMd} /> : <MarkdownText parseEmoji content={description} />}
			<MessageCollapsible title={title} hasDownload={hasDownload} link={getURL(link || url)} size={size} isCollapsed={collapsed}>
				<MessageGenericPreview>
					<video controls preload='metadata' ref={mediaRef} src={src} style={{ maxWidth: 368, width: '100%' }} />
				</MessageGenericPreview>
			</MessageCollapsible>
		</>
	);
};

export default VideoAttachment;