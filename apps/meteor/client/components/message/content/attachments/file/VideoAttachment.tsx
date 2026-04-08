import type { VideoAttachmentProps } from '@rocket.chat/core-typings';
import { Box, MessageGenericPreview } from '@rocket.chat/fuselage';
import { useMediaUrl } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { useReloadOnError } from './hooks/useReloadOnError';
import { userAgentMIMETypeFallback } from '../../../../../lib/utils/userAgentMIMETypeFallback';
import MarkdownText from '../../../../MarkdownText';
import MessageCollapsible from '../../../MessageCollapsible';
import MessageContentBody from '../../../MessageContentBody';
import GazzodownText from '../../../../GazzodownText';

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
	searchText,
}: VideoAttachmentProps & { searchText?: string }) => {
	const getURL = useMediaUrl();
	const src = useMemo(() => getURL(url), [getURL, url]);
	const { mediaRef } = useReloadOnError(src, 'video');

	return (
		<>
			{descriptionMd ? (
				<MessageContentBody md={descriptionMd} searchText={searchText} />
			) : searchText ? (
				<GazzodownText searchText={searchText}>
					<MarkdownText parseEmoji content={description ?? ''} />
				</GazzodownText>
			) : (
				<MarkdownText parseEmoji content={description ?? ''} />
			)}
			<MessageCollapsible title={title} hasDownload={hasDownload} link={getURL(link || url)} size={size} isCollapsed={collapsed}>
				<MessageGenericPreview style={{ maxWidth: 368, width: '100%' }}>
					<Box is='video' controls preload='metadata' ref={mediaRef}>
						<source src={getURL(url)} type={userAgentMIMETypeFallback(type)} />
					</Box>
				</MessageGenericPreview>
			</MessageCollapsible>
		</>
	);
};

export default VideoAttachment;
