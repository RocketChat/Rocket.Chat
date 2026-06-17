import type { VideoAttachmentProps } from '@rocket.chat/core-typings';
import { Box, MessageGenericPreview } from '@rocket.chat/fuselage';
import { useMediaUrl } from '@rocket.chat/ui-contexts';
import { useMemo, useState } from 'react';

import { useReloadOnError } from './hooks/useReloadOnError';
import { userAgentMIMETypeFallback } from '../../../../../lib/utils/userAgentMIMETypeFallback';
import MarkdownText from '../../../../MarkdownText';
import MessageCollapsible from '../../../MessageCollapsible';
import MessageContentBody from '../../../MessageContentBody';

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
}: VideoAttachmentProps) => {
	const getURL = useMediaUrl();
	const src = useMemo(() => getURL(url), [getURL, url]);
	const { mediaRef } = useReloadOnError(src, 'video');
	const [lockedHeight, setLockedHeight] = useState<number | undefined>();

	return (
		<>
			{descriptionMd ? <MessageContentBody md={descriptionMd} /> : <MarkdownText parseEmoji content={description} />}
			<MessageCollapsible title={title} hasDownload={hasDownload} link={getURL(link || url)} size={size} isCollapsed={collapsed}>
				<MessageGenericPreview style={{ maxWidth: 368, width: '100%', minHeight: lockedHeight }}>
					<Box
						is='video'
						minHeight={80}
						controls
						preload='metadata'
						ref={mediaRef}
						onLoadedMetadata={(event) => {
							const video = event.currentTarget as HTMLVideoElement;
							setLockedHeight(video.parentElement?.offsetHeight);
						}}
					>
						<source src={getURL(url)} type={userAgentMIMETypeFallback(type)} />
					</Box>
				</MessageGenericPreview>
			</MessageCollapsible>
		</>
	);
};

export default VideoAttachment;
