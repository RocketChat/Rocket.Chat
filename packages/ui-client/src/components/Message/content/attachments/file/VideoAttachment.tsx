import type { VideoAttachmentProps } from '@rocket.chat/core-typings';
import { Box, MessageGenericPreview } from '@rocket.chat/fuselage';
import { useMediaUrl } from '@rocket.chat/ui-contexts';
import { useContext, useMemo } from 'react';

import { useReloadOnError } from './hooks/useReloadOnError';
import { MarkdownTextContext } from '../../../../MarkdownTextContext';
import MessageCollapsible from '../../../MessageCollapsible';
import MessageContentBody from '../../../MessageContentBody';
import { userAgentMIMETypeFallback } from '../../../lib/userAgentMIMETypeFallback';

export type VideoAttachmentComponentProps = VideoAttachmentProps;

const VideoAttachment = ({
	title,
	video_url: url,
	video_type: type,
	video_size: size,
	description,
	descriptionMd,
	title_link: link,
	title_link_download: hasDownload,
	collapsed,
}: VideoAttachmentComponentProps) => {
	const MarkdownText = useContext(MarkdownTextContext);
	const getURL = useMediaUrl();
	const src = useMemo(() => getURL(url), [getURL, url]);
	const { mediaRef } = useReloadOnError(src, 'video');

	return (
		<>
			{descriptionMd ? (
				<MessageContentBody md={descriptionMd} msg={description} />
			) : (
				<MarkdownText parseEmoji content={description ?? ''} />
			)}
			<MessageCollapsible title={title} hasDownload={hasDownload} link={getURL(link || url)} size={size} isCollapsed={collapsed}>
				<MessageGenericPreview style={{ maxWidth: 368, width: '100%' }}>
					<Box is='video' controls preload='metadata' ref={mediaRef} position='relative'>
						<source src={getURL(url)} type={userAgentMIMETypeFallback(type)} />
					</Box>
				</MessageGenericPreview>
			</MessageCollapsible>
		</>
	);
};

export default VideoAttachment;
